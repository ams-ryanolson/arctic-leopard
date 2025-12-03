<?php

namespace App\Services\Messaging;

use App\Events\Messaging\MessageRead;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Event;

class ConversationService
{
    public function __construct(
        private ConnectionInterface $connection,
        private MessageAnalyticsService $analytics,
        private MessagingAuthorizationService $messagingAuthorization,
    ) {}

    /**
     * Start or reuse a direct conversation between two users.
     */
    public function startDirectConversation(User $initiator, User $recipient, array $attributes = []): Conversation
    {
        // Check if initiator can message recipient based on recipient's messaging preferences
        if (! $this->messagingAuthorization->canMessage($initiator, $recipient)) {
            throw new AuthorizationException('You cannot send a message to this user based on their messaging preferences.');
        }

        $this->assertUsersCanInteract($initiator, $recipient);

        $existing = Conversation::query()
            ->where('type', 'direct')
            ->whereHas('participants', fn ($query) => $query
                ->whereNull('left_at')
                ->where('user_id', $initiator->getKey()))
            ->whereHas('participants', fn ($query) => $query
                ->whereNull('left_at')
                ->where('user_id', $recipient->getKey()))
            ->whereDoesntHave('participants', fn ($query) => $query
                ->whereNull('left_at')
                ->whereNotIn('user_id', [$initiator->getKey(), $recipient->getKey()]))
            ->first();

        if ($existing instanceof Conversation) {
            return $existing;
        }

        return $this->connection->transaction(function () use ($initiator, $recipient, $attributes): Conversation {
            $conversation = Conversation::query()->create([
                'type' => 'direct',
                'subject' => $attributes['subject'] ?? null,
                'creator_id' => $initiator->getKey(),
                'settings' => $attributes['settings'] ?? [],
                'metadata' => $attributes['metadata'] ?? [],
            ]);

            $this->attachParticipant($conversation, $initiator, 'owner');
            $this->attachParticipant($conversation, $recipient, 'member');

            $this->refreshParticipantMetrics($conversation);

            return $conversation->fresh(['participants.user']);
        });
    }

    /**
     * Start a group conversation with the provided participant identifiers.
     *
     * @param  array<int, int>  $participantIds
     */
    public function startGroupConversation(User $initiator, array $participantIds, array $attributes = []): Conversation
    {
        $participantIds = collect($participantIds)
            ->map(static fn ($id) => (int) $id)
            ->filter()
            ->unique()
            ->values();

        if (! $participantIds->contains($initiator->getKey())) {
            $participantIds->prepend($initiator->getKey());
        }

        if ($participantIds->count() < 2) {
            throw new \InvalidArgumentException('A conversation requires at least two participants.');
        }

        /** @var EloquentCollection<int, User> $users */
        $users = User::query()
            ->whereIn('id', $participantIds)
            ->get()
            ->keyBy(fn (User $user) => $user->getKey());

        if ($users->count() !== $participantIds->count()) {
            throw new \InvalidArgumentException('One or more participants could not be found.');
        }

        $users->each(function (User $user) use ($initiator): void {
            $this->assertUsersCanInteract($initiator, $user);
        });

        return $this->connection->transaction(function () use ($initiator, $users, $participantIds, $attributes): Conversation {
            $conversation = Conversation::query()->create([
                'type' => 'group',
                'subject' => $attributes['subject'] ?? null,
                'creator_id' => $initiator->getKey(),
                'settings' => $attributes['settings'] ?? [],
                'metadata' => $attributes['metadata'] ?? [],
            ]);

            foreach ($participantIds as $participantId) {
                /** @var User $user */
                $user = $users->get($participantId);
                $role = $user->is($initiator) ? 'owner' : 'member';

                $this->attachParticipant($conversation, $user, $role);
            }

            $this->refreshParticipantMetrics($conversation);

            return $conversation->fresh(['participants.user']);
        });
    }

    /**
     * @param  array<int, int>  $participantIds
     */
    public function addParticipants(Conversation $conversation, User $actor, array $participantIds): Conversation
    {
        if ($conversation->isDirect()) {
            throw new \InvalidArgumentException('Cannot add participants to a direct conversation.');
        }

        $participantIds = collect($participantIds)
            ->map(static fn ($id) => (int) $id)
            ->filter(fn (int $id) => $id !== $actor->getKey())
            ->unique()
            ->values();

        if ($participantIds->isEmpty()) {
            return $conversation->fresh(['participants.user']);
        }

        /** @var Collection<int, User> $users */
        $users = User::query()
            ->whereIn('id', $participantIds)
            ->get()
            ->keyBy(fn (User $user) => $user->getKey());

        if ($users->isEmpty()) {
            return $conversation->fresh(['participants.user']);
        }

        $this->connection->transaction(function () use ($conversation, $actor, $users): void {
            foreach ($users as $user) {
                $this->assertUsersCanInteract($actor, $user);

                $participant = $conversation->participants()
                    ->where('user_id', $user->getKey())
                    ->lockForUpdate()
                    ->first();

                if ($participant instanceof ConversationParticipant) {
                    if ($participant->left_at !== null) {
                        $participant->update([
                            'left_at' => null,
                            'joined_at' => Carbon::now(),
                        ]);
                    }

                    continue;
                }

                $this->attachParticipant($conversation, $user, 'member');
            }

            $this->refreshParticipantMetrics($conversation);
        });

        return $conversation->fresh(['participants.user']);
    }

    public function leaveConversation(Conversation $conversation, User $user): void
    {
        $this->connection->transaction(function () use ($conversation, $user): void {
            $participant = $conversation->participants()
                ->where('user_id', $user->getKey())
                ->lockForUpdate()
                ->first();

            if (! $participant instanceof ConversationParticipant) {
                return;
            }

            if ($participant->left_at !== null) {
                return;
            }

            $participant->update([
                'left_at' => Carbon::now(),
            ]);

            $this->refreshParticipantMetrics($conversation);
        });
    }

    public function markRead(Conversation $conversation, User $user, ?Message $message = null): void
    {
        $messageId = $message?->getKey();
        $timestamp = $message?->created_at ?? Carbon::now();

        $this->connection->transaction(function () use ($conversation, $user, $messageId, $timestamp): void {
            $conversation->participants()
                ->where('user_id', $user->getKey())
                ->update([
                    'last_read_message_id' => $messageId,
                    'last_read_at' => $timestamp,
                ]);
        });

        Event::dispatch(new MessageRead($conversation, $user, $message));
    }

    public function sendSystemMessage(Conversation $conversation, string $body, array $metadata = []): Message
    {
        return $this->connection->transaction(function () use ($conversation, $body, $metadata): Message {
            $message = Message::query()->create([
                'conversation_id' => $conversation->getKey(),
                'user_id' => null,
                'type' => 'system',
                'sequence' => $conversation->message_count + 1,
                'body' => $body,
                'metadata' => $metadata,
                'visible_at' => Carbon::now(),
            ]);

            $conversation->update([
                'message_count' => $conversation->message_count + 1,
                'last_message_id' => $message->getKey(),
                'last_message_at' => $message->created_at ?? Carbon::now(),
            ]);

            $this->analytics->recordSystemMessage($conversation);

            return $message;
        });
    }

    protected function attachParticipant(Conversation $conversation, User $user, string $role = 'member'): ConversationParticipant
    {
        return $conversation->participants()->create([
            'user_id' => $user->getKey(),
            'role' => $role,
            'joined_at' => Carbon::now(),
            'settings' => [],
            'metadata' => [],
        ]);
    }

    protected function refreshParticipantMetrics(Conversation $conversation): void
    {
        $counts = $conversation->participants()
            ->selectRaw('SUM(CASE WHEN left_at IS NULL THEN 1 ELSE 0 END) as active_count')
            ->selectRaw('COUNT(*) as total_count')
            ->first();

        $conversation->update([
            'participant_count' => (int) ($counts?->active_count ?? 0),
        ]);
    }

    protected function assertUsersCanInteract(User $a, User $b): void
    {
        if ($a->hasBlockRelationshipWith($b)) {
            throw new AuthorizationException('Blocked users cannot begin a conversation.');
        }
    }
}

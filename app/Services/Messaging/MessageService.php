<?php

namespace App\Services\Messaging;

use App\Events\Messaging\MessageDeleted as MessageDeletedEvent;
use App\Events\Messaging\MessageSent as MessageSentEvent;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\User;
use App\Notifications\Messages\MessageReceivedNotification;
use App\Services\Toasts\ToastBus;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class MessageService
{
    public function __construct(
        private ConnectionInterface $connection,
        private Dispatcher $events,
        private ToastBus $toasts,
        private MessageAttachmentService $attachments,
        private MessageAnalyticsService $analytics,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public function sendMessage(User $sender, Conversation $conversation, array $payload): Message
    {
        return $this->connection->transaction(function () use ($sender, $conversation, $payload): Message {
            $conversation = Conversation::query()
                ->whereKey($conversation->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $conversation->loadMissing('participants.user');

            $participant = $conversation->participants
                ->first(fn (ConversationParticipant $participant) => (int) $participant->user_id === (int) $sender->getKey());

            if (! $participant instanceof ConversationParticipant || $participant->left_at !== null) {
                throw new AuthorizationException('You are not a participant in this conversation.');
            }

            $conversation->participants
                ->filter(fn (ConversationParticipant $p) => $p->left_at === null && (int) $p->user_id !== (int) $sender->getKey())
                ->each(function (ConversationParticipant $other) use ($sender): void {
                    if ($other->user instanceof User && $other->user->hasBlockRelationshipWith($sender)) {
                        throw new AuthorizationException('You cannot message a user who has blocked you.');
                    }
                });

            $now = Carbon::now();
            $nextSequence = $conversation->message_count + 1;

            $message = Message::query()->create([
                'conversation_id' => $conversation->getKey(),
                'user_id' => $sender->getKey(),
                'reply_to_id' => $payload['reply_to_id'] ?? null,
                'type' => $payload['type'] ?? 'message',
                'sequence' => $payload['sequence'] ?? $nextSequence,
                'body' => $payload['body'] ?? null,
                'fragments' => $payload['fragments'] ?? null,
                'metadata' => $payload['metadata'] ?? [],
                'visible_at' => $payload['visible_at'] ?? $now,
                'undo_expires_at' => $payload['undo_expires_at'] ?? $now->copy()->addMinutes(5),
            ]);

            $conversation->update([
                'message_count' => $nextSequence,
                'last_message_id' => $message->getKey(),
                'last_message_at' => $message->created_at ?? $now,
            ]);

            $participant->forceFill([
                'last_read_message_id' => $message->getKey(),
                'last_read_at' => $message->created_at ?? $now,
            ])->save();

            if (! empty($payload['attachments'] ?? [])) {
                $this->attachments->attachFromTemporary($message, $sender, $payload['attachments']);
            }

            $message->load(['author', 'attachments', 'reactions']);

            $this->events->dispatch(new MessageSentEvent($message));
            $this->notifyParticipants($conversation, $message, $sender);
            $this->analytics->recordMessageSent($message);

            return $message->fresh(
                'conversation',
                'author',
                'attachments',
                'reactions',
            );
        });
    }

    public function deleteMessage(User $actor, Message $message): Message
    {
        if (! $actor->can('delete', $message)) {
            throw new AuthorizationException('You may not delete this message.');
        }

        return $this->connection->transaction(function () use ($actor, $message): Message {
            $message->forceFill([
                'deleted_by_id' => $actor->getKey(),
                'deleted_at' => Carbon::now(),
                'redacted_at' => Carbon::now(),
            ])->save();

            $message->refresh();
            $this->events->dispatch(new MessageDeletedEvent($message));

            return $message;
        });
    }

    public function undoDeletion(User $actor, Message $message): Message
    {
        if (! $actor->can('undo', $message)) {
            throw new AuthorizationException('You cannot undo this message.');
        }

        return $this->connection->transaction(function () use ($message): Message {
            $message->forceFill([
                'deleted_by_id' => null,
                'deleted_at' => null,
                'redacted_at' => null,
            ])->save();

            $message->refresh();
            $this->events->dispatch(new MessageDeletedEvent($message));

            return $message;
        });
    }

    public function markMessageRead(Conversation $conversation, User $user, Message $message): void
    {
        ConversationParticipant::query()
            ->where('conversation_id', $conversation->getKey())
            ->where('user_id', $user->getKey())
            ->update([
                'last_read_message_id' => $message->getKey(),
                'last_read_at' => Carbon::now(),
            ]);
    }

    public function threadContext(Message $message, int $limit = 3): Collection
    {
        $context = collect();
        $current = $message->replyTo;

        while ($current instanceof Message && $context->count() < $limit) {
            $context->push($current);
            $current = $current->replyTo;
        }

        return EloquentCollection::make($context->all());
    }

    public function fetchMessages(Conversation $conversation, int $perPage = 50): EloquentCollection
    {
        return $conversation->messages()
            ->with(['author', 'attachments', 'reactions'])
            ->orderByDesc('sequence')
            ->take($perPage)
            ->get();
    }

    protected function notifyParticipants(Conversation $conversation, Message $message, User $sender): void
    {
        $conversation->loadMissing(['participants.user']);

        $preview = Str::limit((string) $message->body, 120);
        $from = $sender->display_name ?? $sender->username ?? $sender->name ?? 'Someone';

        $conversation->participants
            ->filter(fn (ConversationParticipant $participant): bool => $participant->left_at === null)
            ->reject(fn (ConversationParticipant $participant): bool => (int) $participant->user_id === (int) $sender->getKey())
            ->each(function (ConversationParticipant $participant) use ($conversation, $message, $from, $preview): void {
                if (! $participant->user instanceof User) {
                    return;
                }

                $this->toasts->info($participant->user, sprintf('%s sent you a new message', $from), [
                    'category' => 'messaging',
                    'title' => 'New message',
                    'actions' => [
                        [
                            'key' => 'view-conversation',
                            'label' => 'View',
                            'method' => 'router.visit',
                            'route' => route('messages.show', ['conversation' => $conversation->ulid]),
                        ],
                    ],
                    'meta' => [
                        'conversation_id' => $conversation->getKey(),
                        'conversation_ulid' => $conversation->ulid,
                        'message_id' => $message->getKey(),
                        'preview' => $preview,
                    ],
                ]);

                Notification::send($participant->user, new MessageReceivedNotification($message));
            });
    }
}

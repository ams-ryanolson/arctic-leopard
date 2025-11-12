<?php

namespace App\Services\Messaging;

use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\MessageReaction;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Carbon;

class MessageReactionService
{
    public function __construct(
        private ConnectionInterface $connection,
        private MessageAnalyticsService $analytics,
    ) {}

    /**
     * @return array<int, array<string, mixed>>
     */
    public function toggle(User $actor, Message $message, string $emoji, ?string $variant = null): array
    {
        if (! $actor->can('view', $message)) {
            throw new AuthorizationException('You may not react to this message.');
        }

        return $this->connection->transaction(function () use ($actor, $message, $emoji, $variant): array {
            $reaction = MessageReaction::query()
                ->where('message_id', $message->getKey())
                ->where('user_id', $actor->getKey())
                ->where('emoji', $emoji)
                ->where('variant', $variant)
                ->lockForUpdate()
                ->first();

            if ($reaction instanceof MessageReaction) {
                $reaction->delete();
            } else {
                MessageReaction::query()->create([
                    'message_id' => $message->getKey(),
                    'user_id' => $actor->getKey(),
                    'emoji' => $emoji,
                    'variant' => $variant,
                    'metadata' => [],
                ]);

                $this->analytics->recordReaction($message, $actor);
            }

            return $this->summary($message->fresh(['reactions']), $actor);
        });
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function summary(Message $message, ?User $viewer = null): array
    {
        $message->loadMissing('reactions');

        $reactions = $message->reactions instanceof EloquentCollection
            ? $message->reactions
            : EloquentCollection::make();

        return $reactions
            ->groupBy(fn (MessageReaction $reaction) => $reaction->emoji.'|'.($reaction->variant ?? ''))
            ->map(function ($group) use ($viewer) {
                /** @var EloquentCollection<int, MessageReaction> $group */
                $first = $group->first();

                return [
                    'emoji' => $first?->emoji,
                    'variant' => $first?->variant,
                    'count' => $group->count(),
                    'reacted' => $viewer instanceof User
                        ? $group->contains(fn (MessageReaction $reaction) => (int) $reaction->user_id === (int) $viewer->getKey())
                        : false,
                ];
            })
            ->values()
            ->all();
    }
}

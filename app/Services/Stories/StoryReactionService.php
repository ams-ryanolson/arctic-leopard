<?php

namespace App\Services\Stories;

use App\Models\Story;
use App\Models\StoryReaction;
use App\Models\User;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;

class StoryReactionService
{
    public function __construct(
        private ConnectionInterface $connection,
    ) {}

    /**
     * Toggle a reaction on a story.
     *
     * @return array<int, array<string, mixed>>
     */
    public function toggle(User $user, Story $story, string $emoji): array
    {
        // Validate emoji is allowed
        $allowedReactions = config('stories.allowed_reactions', ['❤️', '🔥', '👍', '😍', '😮']);

        if (! in_array($emoji, $allowedReactions, true)) {
            throw new \InvalidArgumentException("Emoji '{$emoji}' is not allowed.");
        }

        return $this->connection->transaction(function () use ($user, $story, $emoji): array {
            $reaction = StoryReaction::query()
                ->where('story_id', $story->getKey())
                ->where('user_id', $user->getKey())
                ->where('emoji', $emoji)
                ->lockForUpdate()
                ->first();

            if ($reaction instanceof StoryReaction) {
                $reaction->delete();
                $story->decrementReactionsCount();
            } else {
                StoryReaction::query()->create([
                    'story_id' => $story->getKey(),
                    'user_id' => $user->getKey(),
                    'emoji' => $emoji,
                ]);

                $story->incrementReactionsCount();
            }

            return $this->getReactions($story->fresh(['reactions']), $user);
        });
    }

    /**
     * Get reaction summary for a story.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getReactions(Story $story, ?User $viewer = null): array
    {
        $story->loadMissing('reactions');

        $reactions = $story->reactions instanceof EloquentCollection
            ? $story->reactions
            : EloquentCollection::make();

        return $reactions
            ->groupBy('emoji')
            ->map(function ($group) use ($viewer) {
                /** @var EloquentCollection<int, StoryReaction> $group */
                $first = $group->first();

                return [
                    'emoji' => $first?->emoji,
                    'count' => $group->count(),
                    'reacted' => $viewer instanceof User
                        ? $group->contains(fn (StoryReaction $reaction) => (int) $reaction->user_id === (int) $viewer->getKey())
                        : false,
                ];
            })
            ->values()
            ->all();
    }
}

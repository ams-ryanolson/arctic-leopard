<?php

namespace App\Services;

use App\Models\Bookmark;
use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use App\Models\UserBlock;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class UserBlockService
{
    public function __construct(
        private ConnectionInterface $connection,
    ) {}

    public function block(User $blocker, User $blocked, array $attributes = []): UserBlock
    {
        if ($blocker->is($blocked)) {
            throw new \InvalidArgumentException('Users cannot block themselves.');
        }

        return $this->connection->transaction(function () use ($blocker, $blocked, $attributes): UserBlock {
            /** @var UserBlock|null $existing */
            $existing = UserBlock::query()
                ->where('blocker_id', $blocker->getKey())
                ->where('blocked_id', $blocked->getKey())
                ->first();

            if ($existing instanceof UserBlock) {
                return $existing;
            }

            $this->teardownRelationships($blocker, $blocked);

            return UserBlock::query()->create([
                'blocker_id' => $blocker->getKey(),
                'blocked_id' => $blocked->getKey(),
                ...$attributes,
            ]);
        });
    }

    public function unblock(User $blocker, User $blocked): void
    {
        if ($blocker->is($blocked)) {
            return;
        }

        $this->connection->transaction(function () use ($blocker, $blocked): void {
            UserBlock::query()
                ->where('blocker_id', $blocker->getKey())
                ->where('blocked_id', $blocked->getKey())
                ->delete();
        });
    }

    protected function teardownRelationships(User $blocker, User $blocked): void
    {
        $this->removeFollowRelationships($blocker, $blocked);
        $this->pruneBookmarks($blocker, $blocked);
        $this->pruneLikes($blocker, $blocked);
        $this->dropFavorites($blocker, $blocked);
    }

    protected function removeFollowRelationships(User $blocker, User $blocked): void
    {
        $blocker->unfollow($blocked);
        $blocked->unfollow($blocker);
    }

    protected function pruneBookmarks(User $blocker, User $blocked): void
    {
        $blockerPostIds = $this->postIdsAuthoredBy($blocker);
        $blockedPostIds = $this->postIdsAuthoredBy($blocked);

        if ($blockedPostIds->isNotEmpty()) {
            Bookmark::query()
                ->where('user_id', $blocker->getKey())
                ->whereIn('post_id', $blockedPostIds)
                ->delete();
        }

        if ($blockerPostIds->isNotEmpty()) {
            Bookmark::query()
                ->where('user_id', $blocked->getKey())
                ->whereIn('post_id', $blockerPostIds)
                ->delete();
        }
    }

    protected function pruneLikes(User $blocker, User $blocked): void
    {
        $this->removeLikesFor($blocker, $blocked);
        $this->removeLikesFor($blocked, $blocker);
    }

    protected function dropFavorites(User $blocker, User $blocked): void
    {
        $this->removeFavoritesFor($blocker, $blocked);
        $this->removeFavoritesFor($blocked, $blocker);
    }

    protected function removeLikesFor(User $origin, User $target): void
    {
        $targetPostIds = $this->postIdsAuthoredBy($target);
        $targetCommentIds = $this->commentIdsAuthoredBy($target);

        if ($targetPostIds->isNotEmpty()) {
            DB::table(config('like.likes_table'))
                ->where(config('like.user_foreign_key'), $origin->getKey())
                ->where('likeable_type', Post::class)
                ->whereIn('likeable_id', $targetPostIds)
                ->delete();
        }

        if ($targetCommentIds->isNotEmpty()) {
            DB::table(config('like.likes_table'))
                ->where(config('like.user_foreign_key'), $origin->getKey())
                ->where('likeable_type', Comment::class)
                ->whereIn('likeable_id', $targetCommentIds)
                ->delete();
        }
    }

    protected function removeFavoritesFor(User $origin, User $target): void
    {
        $targetPostIds = $this->postIdsAuthoredBy($target);

        if ($targetPostIds->isEmpty()) {
            return;
        }

        DB::table(config('favorite.favorites_table'))
            ->where(config('favorite.user_foreign_key'), $origin->getKey())
            ->where('favoriteable_type', Post::class)
            ->whereIn('favoriteable_id', $targetPostIds)
            ->delete();
    }

    /**
     * @return Collection<int, int>
     */
    protected function postIdsAuthoredBy(User $user): Collection
    {
        return Post::query()
            ->where('user_id', $user->getKey())
            ->pluck('id');
    }

    /**
     * @return Collection<int, int>
     */
    protected function commentIdsAuthoredBy(User $user): Collection
    {
        return Comment::query()
            ->where('user_id', $user->getKey())
            ->pluck('id');
    }
}

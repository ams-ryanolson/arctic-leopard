<?php

namespace App\Services\Cache;

use App\Models\Circle;
use App\Models\Post;
use App\Models\Timeline;
use App\Models\User;
use Closure;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class TimelineCacheService
{
    public function __construct(
        private int $ttlSeconds = 60,
    ) {
    }

    /**
     * Cache the following feed payload for the given user / page.
     *
     * @template T
     *
     * @param  Closure():array<string, mixed>  $resolver
     * @return array<string, mixed>
     */
    public function rememberFollowingFeed(User $user, int $page, Closure $resolver): array
    {
        return Cache::tags($this->tagsForUser($user->getKey()))
            ->remember($this->followingCacheKey($user->getKey(), $page), $this->ttlSeconds, $resolver);
    }

    /**
     * Cache the profile feed payload for the given profile / viewer combo.
     *
     * @param  Closure():array<string, mixed>  $resolver
     * @return array<string, mixed>
     */
    public function rememberUserFeed(User $profile, ?User $viewer, int $page, Closure $resolver): array
    {
        $viewerKey = $viewer?->getKey() ?? 'guest';

        return Cache::tags($this->tagsForUser($profile->getKey()))
            ->remember($this->userFeedCacheKey($profile->getKey(), $viewerKey, $page), $this->ttlSeconds, $resolver);
    }

    /**
     * Cache the circle feed payload for the given circle / viewer combo.
     *
     * @param  Closure():array<string, mixed>  $resolver
     * @return array<string, mixed>
     */
    public function rememberCircleFeed(
        Circle $circle,
        ?User $viewer,
        int $page,
        int $perPage,
        Closure $resolver,
        string $pageName = 'page',
    ): array {
        $viewerKey = $viewer?->getKey() ?? 'guest';

        return Cache::tags($this->tagsForCircle($circle->getKey()))
            ->remember(
                $this->circleFeedCacheKey($circle->getKey(), $viewerKey, $perPage, $pageName, $page),
                $this->ttlSeconds,
                $resolver,
            );
    }

    public function forgetForUser(User|int $user): void
    {
        $userId = $user instanceof User ? $user->getKey() : $user;

        Cache::tags($this->tagsForUser($userId))->flush();
    }

    /**
     * @param  iterable<int, User|int>  $users
     */
    public function forgetForUsers(iterable $users): void
    {
        $uniqueIds = collect($users)
            ->map(function ($user) {
                if ($user instanceof User) {
                    return $user->getKey();
                }

                if (is_int($user) || ctype_digit((string) $user)) {
                    return (int) $user;
                }

                return null;
            })
            ->filter(static fn ($id) => $id !== null)
            ->unique()
            ->all();

        foreach ($uniqueIds as $userId) {
            Cache::tags($this->tagsForUser($userId))->flush();
        }
    }

    public function forgetForPost(Post|int $post): void
    {
        $postId = $post instanceof Post ? $post->getKey() : $post;

        $timelineUserIds = Timeline::query()
            ->where('post_id', $postId)
            ->pluck('user_id')
            ->all();

        if ($timelineUserIds !== []) {
            $this->forgetForUsers($timelineUserIds);
        }

        $circleIds = [];

        if ($post instanceof Post) {
            $circleIds = $post->relationLoaded('circles')
                ? $post->circles->pluck('id')->all()
                : $post->circles()->pluck('circles.id')->all();
        } else {
            $circleIds = DB::table('circle_post')
                ->where('post_id', $postId)
                ->pluck('circle_id')
                ->all();
        }

        if ($circleIds !== []) {
            $this->forgetForCircles($circleIds);
        }
    }

    public function flushAll(): void
    {
        Cache::tags(['timeline'])->flush();
    }

    public function forgetForCircle(Circle|int $circle): void
    {
        $circleId = $circle instanceof Circle ? $circle->getKey() : (int) $circle;

        Cache::tags($this->tagsForCircle($circleId))->flush();
    }

    /**
     * @param  iterable<int, Circle|int>  $circles
     */
    public function forgetForCircles(iterable $circles): void
    {
        $ids = collect($circles)
            ->map(function ($circle) {
                if ($circle instanceof Circle) {
                    return $circle->getKey();
                }

                if (is_int($circle) || ctype_digit((string) $circle)) {
                    return (int) $circle;
                }

                return null;
            })
            ->filter(static fn ($id) => $id !== null)
            ->unique()
            ->all();

        foreach ($ids as $circleId) {
            Cache::tags($this->tagsForCircle($circleId))->flush();
        }
    }

    /**
     * @return list<string>
     */
    private function tagsForUser(int $userId): array
    {
        return [
            'timeline',
            "timeline:user:{$userId}",
        ];
    }

    /**
     * @return list<string>
     */
    private function tagsForCircle(int $circleId): array
    {
        return [
            'timeline',
            "timeline:circle:{$circleId}",
        ];
    }

    private function followingCacheKey(int $userId, int $page): string
    {
        return "timeline:following:{$userId}:page:{$page}";
    }

    private function userFeedCacheKey(int|string $profileId, int|string $viewerKey, int $page): string
    {
        return "timeline:user-feed:{$profileId}:viewer:{$viewerKey}:page:{$page}";
    }

    private function circleFeedCacheKey(int $circleId, int|string $viewerKey, int $perPage, string $pageName, int $page): string
    {
        return "timeline:circle-feed:{$circleId}:viewer:{$viewerKey}:per-page:{$perPage}:page-name:{$pageName}:page:{$page}";
    }
}


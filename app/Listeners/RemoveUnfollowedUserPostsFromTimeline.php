<?php

namespace App\Listeners;

use App\Enums\TimelineVisibilitySource;
use App\Events\UserUnfollowed;
use App\Models\Post;
use App\Models\Timeline;
use App\Services\Cache\TimelineCacheService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class RemoveUnfollowedUserPostsFromTimeline implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'timelines';

    public function __construct(
        private readonly TimelineCacheService $timelineCache,
    ) {}

    public function handle(UserUnfollowed $event): void
    {
        $follower = $event->follower;
        $unfollowed = $event->unfollowed;

        // Get all post IDs from the unfollowed user
        $unfollowedPostIds = Post::query()
            ->where('user_id', $unfollowed->getKey())
            ->pluck('id')
            ->all();

        if ($unfollowedPostIds === []) {
            return;
        }

        // Remove timeline entries for posts from the unfollowed user
        // Only remove entries that were added because of following (Following visibility source)
        // Keep entries from other sources (e.g., PaywallPurchase, Subscription, SelfAuthored)
        Timeline::query()
            ->where('user_id', $follower->getKey())
            ->whereIn('post_id', $unfollowedPostIds)
            ->where('visibility_source', TimelineVisibilitySource::Following->value)
            ->delete();

        // Clear cache for the follower
        $this->timelineCache->forgetForUser($follower);
    }
}

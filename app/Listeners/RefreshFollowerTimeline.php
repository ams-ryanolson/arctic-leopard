<?php

namespace App\Listeners;

use App\Events\UserFollowAccepted;
use App\Jobs\RebuildTimelineJob;
use App\Services\Cache\TimelineCacheService;

class RefreshFollowerTimeline
{
    public function __construct(
        private readonly TimelineCacheService $timelineCache,
    ) {}

    public function handle(UserFollowAccepted $event): void
    {
        $follower = $event->follower;

        RebuildTimelineJob::dispatch($follower->getKey())->onQueue('timelines');

        $this->timelineCache->forgetForUser($follower);
    }
}

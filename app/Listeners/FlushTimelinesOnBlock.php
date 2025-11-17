<?php

namespace App\Listeners;

use App\Events\UserBlocked;
use App\Models\Post;
use App\Models\Timeline;
use App\Services\Cache\TimelineCacheService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class FlushTimelinesOnBlock implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'timelines';

    public function __construct(private TimelineCacheService $timelineCache) {}

    public function handle(UserBlocked $event): void
    {
        $block = $event->block;

        Timeline::query()
            ->where('user_id', $block->blocker_id)
            ->whereIn('post_id', Post::query()
                ->where('user_id', $block->blocked_id)
                ->select('id'))
            ->delete();

        Timeline::query()
            ->where('user_id', $block->blocked_id)
            ->whereIn('post_id', Post::query()
                ->where('user_id', $block->blocker_id)
                ->select('id'))
            ->delete();

        $this->timelineCache->forgetForUser($block->blocker_id);
        $this->timelineCache->forgetForUser($block->blocked_id);
    }
}

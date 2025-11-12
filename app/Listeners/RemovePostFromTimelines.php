<?php

namespace App\Listeners;

use App\Events\PostDeleted;
use App\Services\Cache\PostCacheService;
use App\Services\Cache\TimelineCacheService;
use App\Models\Timeline;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class RemovePostFromTimelines implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'timelines';

    public function __construct(
        private TimelineCacheService $timelineCache,
        private PostCacheService $postCache,
    ) {
    }

    public function handle(PostDeleted $event): void
    {
        $post = $event->post;
        $post->loadMissing('author');

        $this->timelineCache->forgetForPost($post);
        $this->timelineCache->forgetForUsers([
            $post->author,
        ]);

        Timeline::query()
            ->where('post_id', $post->getKey())
            ->delete();

        $this->postCache->forget($post);
    }
}

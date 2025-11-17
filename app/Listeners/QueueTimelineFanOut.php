<?php

namespace App\Listeners;

use App\Events\PostPublished;
use App\Jobs\TimelineFanOutJob;
use App\Services\Cache\PostCacheService;
use App\Services\Cache\TimelineCacheService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class QueueTimelineFanOut implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'timelines';

    public function __construct(
        private TimelineCacheService $timelineCache,
        private PostCacheService $postCache,
    ) {}

    public function handle(PostPublished $event): void
    {
        $post = $event->post;
        $post->loadMissing('author');

        TimelineFanOutJob::dispatch($post->getKey())
            ->onQueue($this->queue);

        $this->timelineCache->forgetForUsers([
            $post->author,
        ]);
        $this->postCache->forget($post);
    }
}

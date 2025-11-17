<?php

namespace App\Listeners;

use App\Enums\PostAudience;
use App\Events\PostAudienceChanged;
use App\Jobs\TimelineFanOutJob;
use App\Models\Timeline;
use App\Services\Cache\PostCacheService;
use App\Services\Cache\TimelineCacheService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class RefreshTimelineForAudienceChange implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'timelines';

    public function __construct(
        private TimelineCacheService $timelineCache,
        private PostCacheService $postCache,
    ) {}

    public function handle(PostAudienceChanged $event): void
    {
        $post = $event->post;
        $post->loadMissing('author');

        $this->timelineCache->forgetForPost($post);
        $this->timelineCache->forgetForUsers([
            $post->author,
        ]);

        Timeline::query()
            ->where('post_id', $post->getKey())
            ->where('user_id', '<>', $post->user_id)
            ->delete();

        if (in_array($event->newAudience, [PostAudience::Followers, PostAudience::Subscribers], true)) {
            TimelineFanOutJob::dispatch($post->getKey())
                ->onQueue($this->queue);
        }

        $this->postCache->forget($post);
    }
}

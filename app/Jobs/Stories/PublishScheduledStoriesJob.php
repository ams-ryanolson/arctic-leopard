<?php

namespace App\Jobs\Stories;

use App\Models\Story;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class PublishScheduledStoriesJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $now = Carbon::now();
        $expirationHours = (int) config('stories.expiration_hours', 24);

        // Query stories that are scheduled and not yet published
        $scheduledStories = Story::query()
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', $now)
            ->whereNull('published_at')
            ->whereNull('deleted_at')
            ->get();

        $count = $scheduledStories->count();

        if ($count === 0) {
            return;
        }

        // Publish scheduled stories
        foreach ($scheduledStories as $story) {
            $story->published_at = $now;
            $story->expires_at = $now->copy()->addHours($expirationHours);
            $story->save();
        }

        Log::info("Published {$count} scheduled story/stories.", [
            'job' => self::class,
            'published_count' => $count,
        ]);
    }
}

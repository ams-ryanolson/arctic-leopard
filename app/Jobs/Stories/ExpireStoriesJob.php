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

class ExpireStoriesJob implements ShouldQueue
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

        // Query stories that are expired and not already soft deleted
        $expiredStories = Story::query()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', $now)
            ->whereNull('deleted_at')
            ->get();

        $count = $expiredStories->count();

        if ($count === 0) {
            return;
        }

        // Soft delete expired stories (preserves data for future features)
        foreach ($expiredStories as $story) {
            $story->delete();
        }

        Log::info("Expired {$count} story/stories.", [
            'job' => self::class,
            'expired_count' => $count,
        ]);
    }
}

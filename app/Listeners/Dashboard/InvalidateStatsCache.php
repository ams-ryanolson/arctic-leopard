<?php

namespace App\Listeners\Dashboard;

use Illuminate\Support\Facades\Cache;

class InvalidateStatsCache
{
    /**
     * Handle the event.
     */
    public function handle(): void
    {
        Cache::tags(['dashboard', 'stats'])->flush();
    }
}

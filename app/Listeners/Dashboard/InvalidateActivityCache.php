<?php

namespace App\Listeners\Dashboard;

use Illuminate\Support\Facades\Cache;

class InvalidateActivityCache
{
    /**
     * Handle the event.
     */
    public function handle(): void
    {
        Cache::tags(['dashboard', 'activity'])->flush();
    }
}

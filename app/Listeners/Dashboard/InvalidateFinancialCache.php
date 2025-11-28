<?php

namespace App\Listeners\Dashboard;

use Illuminate\Support\Facades\Cache;

class InvalidateFinancialCache
{
    /**
     * Handle the event.
     */
    public function handle(): void
    {
        Cache::tags(['dashboard', 'financial'])->flush();
    }
}

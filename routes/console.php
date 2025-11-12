<?php

use App\Jobs\PostMetricsAggregatorJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('uploads:clean-temp')->hourly();
Schedule::command('payments:expire-pending')->everyFifteenMinutes();
Schedule::command('subscriptions:expire')->hourly();
Schedule::command('subscriptions:send-renewal-reminders')->twiceDaily(9, 21);
Schedule::job(new PostMetricsAggregatorJob())->dailyAt('01:30');

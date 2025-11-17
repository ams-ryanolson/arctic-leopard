<?php

use App\Jobs\Ads\GenerateAdReport;
use App\Jobs\PostMetricsAggregatorJob;
use App\Jobs\Stories\ExpireStoriesJob;
use App\Jobs\Stories\PublishScheduledStoriesJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('uploads:clean-temp')->hourly();
Schedule::command('payments:expire-pending')->everyFifteenMinutes();
Schedule::command('subscriptions:expire')->hourly();
Schedule::command('subscriptions:send-renewal-reminders')->twiceDaily(9, 21);
Schedule::command('exports:cleanup-expired')->daily();
Schedule::command('verification:check-expirations')->daily();
Schedule::job(new PostMetricsAggregatorJob)->dailyAt('01:30');
Schedule::job(new GenerateAdReport(Carbon::yesterday()))
    ->daily()
    ->at('02:00')
    ->onOneServer();
Schedule::job(new ExpireStoriesJob)->hourly();
Schedule::job(new PublishScheduledStoriesJob)->everyFiveMinutes();

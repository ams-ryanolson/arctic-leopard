<?php

namespace App\Jobs\Ads;

use App\Services\Ads\AdReportingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class GenerateAdReport implements ShouldQueue
{
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public function __construct(
        public Carbon $date,
    ) {}

    public function handle(AdReportingService $reportingService): void
    {
        $reportingService->generateDailyReport($this->date);
    }
}

<?php

namespace App\Jobs\Ads;

use App\Enums\Ads\AdPlacement;
use App\Enums\Ads\AdStatus;
use App\Models\Ads\Ad;
use App\Models\Ads\AdCreative;
use App\Models\Ads\AdImpression;
use App\Models\User;
use App\Services\Ads\AdPricingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Request;

class LogAdImpression implements ShouldQueue
{
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    /**
     * @param  array<string, mixed>  $context
     */
    public function __construct(
        public AdCreative $creative,
        public AdPlacement $placement,
        public ?User $viewer,
        public array $context = [],
    ) {}

    public function handle(AdPricingService $pricingService): void
    {
        $ad = $this->creative->ad;

        // Check if ad is still eligible
        if ($ad->status !== AdStatus::Active) {
            return;
        }

        // Record impression
        $impression = AdImpression::create([
            'ad_id' => $ad->getKey(),
            'ad_creative_id' => $this->creative->getKey(),
            'placement' => $this->placement,
            'user_id' => $this->viewer?->getKey(),
            'session_id' => $this->context['session_id'] ?? session()->getId(),
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'referrer' => Request::header('referer'),
            'viewed_at' => now(),
            'metadata' => $this->context,
        ]);

        // Calculate cost and update spend
        $cost = $pricingService->calculateCost($ad, 1, 0);
        if ($cost > 0) {
            $pricingService->updateSpend($ad, $cost);
        }

        // Check if caps are exceeded and pause ad if needed
        $this->checkCaps($ad);
    }

    private function checkCaps(Ad $ad): void
    {
        $shouldPause = false;

        // Check total impression cap
        if ($ad->max_impressions) {
            $totalImpressions = $ad->impressions()->count();
            if ($totalImpressions >= $ad->max_impressions) {
                $shouldPause = true;
            }
        }

        // Check budget
        if ($ad->spent_amount >= $ad->budget_amount) {
            $shouldPause = true;
        }

        if ($shouldPause) {
            DB::table('ads')
                ->where('id', $ad->getKey())
                ->update(['status' => AdStatus::Paused->value]);
        }
    }
}

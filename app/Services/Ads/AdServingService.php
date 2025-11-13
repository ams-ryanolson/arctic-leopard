<?php

namespace App\Services\Ads;

use App\Enums\Ads\AdPlacement;
use App\Jobs\Ads\LogAdClick;
use App\Jobs\Ads\LogAdImpression;
use App\Models\Ads\Ad;
use App\Models\Ads\AdClick;
use App\Models\Ads\AdCreative;
use App\Models\Ads\AdImpression;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class AdServingService
{
    public function __construct(
        private AdPricingService $pricingService,
    ) {}

    /**
     * Serve an ad for a specific placement.
     */
    public function serve(AdPlacement $placement, ?User $viewer = null, array $context = []): ?AdCreative
    {
        // Get eligible ads for this placement
        $ads = Ad::query()
            ->eligible()
            ->forPlacement($placement)
            ->forViewer($viewer)
            ->with(['creatives' => function ($query) use ($placement): void {
                $query->where('placement', $placement->value)
                    ->where('is_active', true)
                    ->where('review_status', 'approved')
                    ->orderBy('display_order');
            }])
            ->get();

        if ($ads->isEmpty()) {
            return null;
        }

        // Filter ads that pass additional eligibility checks
        $eligibleAds = $ads->filter(fn (Ad $ad) => $this->isEligible($ad, $viewer, $context));

        if ($eligibleAds->isEmpty()) {
            return null;
        }

        // Weighted random selection
        $selectedAd = $this->selectWeightedAd($eligibleAds);

        if ($selectedAd === null) {
            return null;
        }

        // Get a creative for this ad
        $creative = $selectedAd->creatives
            ->where('placement', $placement->value)
            ->where('is_active', true)
            ->where('review_status', 'approved')
            ->first();

        return $creative;
    }

    /**
     * Record an impression.
     */
    public function recordImpression(AdCreative $creative, AdPlacement $placement, ?User $viewer = null, array $context = []): AdImpression
    {
        // Queue the job to record asynchronously
        LogAdImpression::dispatch($creative, $placement, $viewer, $context);

        // Return a temporary impression object for immediate use
        return new AdImpression([
            'ad_id' => $creative->ad_id,
            'ad_creative_id' => $creative->getKey(),
            'placement' => $placement,
            'user_id' => $viewer?->getKey(),
            'viewed_at' => now(),
        ]);
    }

    /**
     * Record a click.
     */
    public function recordClick(AdCreative $creative, AdPlacement $placement, ?User $viewer = null, array $context = [], ?AdImpression $impression = null): AdClick
    {
        // Queue the job to record asynchronously
        LogAdClick::dispatch($creative, $placement, $viewer, $context, $impression);

        // Return a temporary click object for immediate use
        return new AdClick([
            'ad_id' => $creative->ad_id,
            'ad_creative_id' => $creative->getKey(),
            'impression_id' => $impression?->getKey(),
            'placement' => $placement,
            'user_id' => $viewer?->getKey(),
            'clicked_at' => now(),
        ]);
    }

    /**
     * Check if an ad is eligible to be shown.
     */
    public function isEligible(Ad $ad, ?User $viewer = null, array $context = []): bool
    {
        // Check budget
        if (! $this->pricingService->checkBudget($ad)) {
            return false;
        }

        // Check date range
        $now = Carbon::now();
        if ($ad->start_date && $ad->start_date->isFuture()) {
            return false;
        }
        if ($ad->end_date && $ad->end_date->isPast()) {
            return false;
        }

        // Check daily caps
        if ($viewer) {
            $today = Carbon::today();
            $dailyImpressions = $ad->impressions()
                ->where('user_id', $viewer->getKey())
                ->whereDate('viewed_at', $today)
                ->count();

            if ($ad->daily_impression_cap && $dailyImpressions >= $ad->daily_impression_cap) {
                return false;
            }

            $dailyClicks = $ad->clicks()
                ->where('user_id', $viewer->getKey())
                ->whereDate('clicked_at', $today)
                ->count();

            if ($ad->daily_click_cap && $dailyClicks >= $ad->daily_click_cap) {
                return false;
            }
        }

        // Check global caps
        $totalImpressions = $ad->impressions()->count();
        if ($ad->max_impressions && $totalImpressions >= $ad->max_impressions) {
            return false;
        }

        $totalClicks = $ad->clicks()->count();
        if ($ad->max_clicks && $totalClicks >= $ad->max_clicks) {
            return false;
        }

        // Check targeting (simplified - can be expanded)
        if ($ad->targeting) {
            $targeting = $ad->targeting;

            if (isset($targeting['require_auth']) && $targeting['require_auth'] && $viewer === null) {
                return false;
            }

            if ($viewer && isset($targeting['roles']) && is_array($targeting['roles'])) {
                $userRoles = $viewer->roles->pluck('name')->toArray();
                if (empty(array_intersect($targeting['roles'], $userRoles))) {
                    return false;
                }
            }

            if ($viewer && isset($targeting['exclude_roles']) && is_array($targeting['exclude_roles'])) {
                $userRoles = $viewer->roles->pluck('name')->toArray();
                if (! empty(array_intersect($targeting['exclude_roles'], $userRoles))) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Select an ad using weighted random selection.
     */
    private function selectWeightedAd(Collection $ads): ?Ad
    {
        if ($ads->isEmpty()) {
            return null;
        }

        // Simple weighted selection - can be enhanced with placement weights
        $totalWeight = $ads->count();
        $random = mt_rand(1, $totalWeight);

        $currentWeight = 0;
        foreach ($ads as $ad) {
            $currentWeight += 1;
            if ($random <= $currentWeight) {
                return $ad;
            }
        }

        return $ads->first();
    }
}

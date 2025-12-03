<?php

namespace App\Services\Ads;

use App\Enums\Ads\PricingModel;
use App\Models\Ads\Ad;
use Illuminate\Support\Facades\DB;

class AdPricingService
{
    /**
     * Calculate cost based on impressions and clicks.
     */
    public function calculateCost(Ad $ad, int $impressions, int $clicks): int
    {
        return match ($ad->pricing_model) {
            PricingModel::Cpm => (int) round(($impressions / 1000) * $ad->pricing_rate),
            PricingModel::Cpc => $clicks * $ad->pricing_rate,
            PricingModel::Cpa => $clicks * $ad->pricing_rate, // Assuming clicks = actions for now
            PricingModel::Flat => $ad->pricing_rate,
        };
    }

    /**
     * Check if ad has budget remaining.
     * Returns true if ad has no budget (admin/promotional ads).
     */
    public function checkBudget(Ad $ad): bool
    {
        // If no budget is set, ad is unlimited (for admin/promotional purposes)
        if ($ad->budget_amount === null || $ad->budget_amount === 0) {
            return true;
        }

        return $ad->spent_amount < $ad->budget_amount;
    }

    /**
     * Update spent amount atomically.
     */
    public function updateSpend(Ad $ad, int $amount): void
    {
        DB::table('ads')
            ->where('id', $ad->getKey())
            ->increment('spent_amount', $amount);

        $ad->refresh();
    }

    /**
     * Estimate reach (impressions) for a given budget.
     */
    public function getEstimatedReach(Ad $ad, int $budget): int
    {
        return match ($ad->pricing_model) {
            PricingModel::Cpm => (int) round(($budget / $ad->pricing_rate) * 1000),
            PricingModel::Cpc => 0, // Cannot estimate impressions from clicks
            PricingModel::Cpa => 0, // Cannot estimate impressions from actions
            PricingModel::Flat => 0, // Flat rate doesn't provide reach estimate
        };
    }
}

<?php

namespace Database\Factories\Ads;

use App\Enums\Ads\AdStatus;
use App\Enums\Ads\PricingModel;
use App\Models\Ads\Ad;
use App\Models\Ads\AdCampaign;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Ad>
 */
class AdFactory extends Factory
{
    protected $model = Ad::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = Carbon::instance($this->faker->dateTimeBetween('now', '+1 month'));
        $endDate = (clone $startDate)->addDays($this->faker->numberBetween(7, 30));
        $budgetAmount = $this->faker->numberBetween(5000, 50000); // $50 - $500
        $pricingModel = Arr::random(PricingModel::values());
        $pricingRate = match ($pricingModel) {
            PricingModel::Cpm->value => $this->faker->numberBetween(200, 1000), // $2 - $10 per 1000
            PricingModel::Cpc->value => $this->faker->numberBetween(20, 200), // $0.20 - $2 per click
            PricingModel::Cpa->value => $this->faker->numberBetween(100, 1000), // $1 - $10 per action
            PricingModel::Flat->value => $budgetAmount,
            default => 500,
        };

        return [
            'advertiser_id' => User::factory(),
            'campaign_id' => null,
            'name' => $this->faker->words(3, true).' Ad',
            'status' => Arr::random(AdStatus::values()),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'max_impressions' => $this->faker->boolean(50) ? $this->faker->numberBetween(10000, 100000) : null,
            'max_clicks' => $this->faker->boolean(50) ? $this->faker->numberBetween(100, 1000) : null,
            'daily_impression_cap' => $this->faker->boolean(30) ? $this->faker->numberBetween(1000, 10000) : null,
            'daily_click_cap' => $this->faker->boolean(30) ? $this->faker->numberBetween(10, 100) : null,
            'budget_amount' => $budgetAmount,
            'budget_currency' => 'USD',
            'spent_amount' => 0,
            'pricing_model' => $pricingModel,
            'pricing_rate' => $pricingRate,
            'targeting' => null,
            'metadata' => null,
            'approved_at' => null,
            'approved_by' => null,
            'rejected_at' => null,
            'rejection_reason' => null,
        ];
    }

    /**
     * Indicate that the ad is active.
     *
     * @return $this
     */
    public function active(): static
    {
        return $this->state(fn () => [
            'status' => AdStatus::Active->value,
            'start_date' => Carbon::now()->subDays(7),
            'end_date' => Carbon::now()->addDays(23),
            'approved_at' => Carbon::now()->subDays(8),
            'approved_by' => User::factory(),
        ]);
    }

    /**
     * Indicate that the ad belongs to a campaign.
     *
     * @return $this
     */
    public function forCampaign(AdCampaign $campaign): static
    {
        return $this->state(fn () => [
            'campaign_id' => $campaign->getKey(),
            'advertiser_id' => $campaign->advertiser_id,
        ]);
    }
}

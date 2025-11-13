<?php

namespace Database\Factories\Ads;

use App\Enums\Ads\CampaignStatus;
use App\Enums\Ads\PacingStrategy;
use App\Models\Ads\AdCampaign;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<AdCampaign>
 */
class AdCampaignFactory extends Factory
{
    protected $model = AdCampaign::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = Carbon::instance($this->faker->dateTimeBetween('now', '+1 month'));
        $endDate = (clone $startDate)->addDays($this->faker->numberBetween(7, 30));
        $totalBudget = $this->faker->numberBetween(10000, 100000); // $100 - $1000

        return [
            'advertiser_id' => User::factory(),
            'name' => $this->faker->words(3, true).' Campaign',
            'status' => Arr::random(CampaignStatus::values()),
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_budget' => $totalBudget,
            'currency' => 'USD',
            'spent_amount' => 0,
            'pacing_strategy' => Arr::random(PacingStrategy::values()),
            'metadata' => null,
        ];
    }

    /**
     * Indicate that the campaign is active.
     *
     * @return $this
     */
    public function active(): static
    {
        return $this->state(fn () => [
            'status' => CampaignStatus::Active->value,
            'start_date' => Carbon::now()->subDays(7),
            'end_date' => Carbon::now()->addDays(23),
        ]);
    }
}

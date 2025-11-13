<?php

namespace Database\Factories\Ads;

use App\Enums\Ads\AdPlacement;
use App\Models\Ads\Ad;
use App\Models\Ads\AdCreative;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<AdImpression>
 */
class AdImpressionFactory extends Factory
{
    protected $model = \App\Models\Ads\AdImpression::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $ad = Ad::factory()->create();
        $creative = AdCreative::factory()->for($ad)->create();

        return [
            'ad_id' => $ad->getKey(),
            'ad_creative_id' => $creative->getKey(),
            'placement' => Arr::random(AdPlacement::values()),
            'user_id' => $this->faker->boolean(70) ? User::factory() : null,
            'session_id' => $this->faker->uuid(),
            'ip_address' => $this->faker->ipv4(),
            'user_agent' => $this->faker->userAgent(),
            'referrer' => $this->faker->boolean(50) ? $this->faker->url() : null,
            'viewed_at' => Carbon::instance($this->faker->dateTimeBetween('-7 days', 'now')),
            'metadata' => null,
        ];
    }
}

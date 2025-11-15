<?php

namespace Database\Factories\Ads;

use App\Enums\Ads\AdPlacement;
use App\Models\Ads\Ad;
use App\Models\Ads\AdCreative;
use App\Models\Ads\AdImpression;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<AdClick>
 */
class AdClickFactory extends Factory
{
    protected $model = \App\Models\Ads\AdClick::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'ad_id' => Ad::factory(),
            'ad_creative_id' => AdCreative::factory(),
            'impression_id' => AdImpression::factory(),
            'placement' => Arr::random(AdPlacement::values()),
            'user_id' => $this->faker->boolean(70) ? User::factory() : null,
            'session_id' => $this->faker->uuid(),
            'ip_address' => $this->faker->ipv4(),
            'user_agent' => $this->faker->userAgent(),
            'clicked_at' => Carbon::instance($this->faker->dateTimeBetween('-7 days', 'now')),
            'metadata' => null,
        ];
    }
}

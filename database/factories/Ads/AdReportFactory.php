<?php

namespace Database\Factories\Ads;

use App\Models\Ads\Ad;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<AdReport>
 */
class AdReportFactory extends Factory
{
    protected $model = \App\Models\Ads\AdReport::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $impressions = $this->faker->numberBetween(100, 10000);
        $clicks = $this->faker->numberBetween(1, $impressions);
        $spend = $this->faker->numberBetween(1000, 50000);
        $ctr = $impressions > 0 ? round($clicks / $impressions, 4) : 0;
        $cpm = $impressions > 0 ? round(($spend / $impressions) * 1000) : null;
        $cpc = $clicks > 0 ? round($spend / $clicks) : null;

        return [
            'ad_id' => Ad::factory(),
            'campaign_id' => null,
            'placement' => null,
            'report_date' => Carbon::instance($this->faker->dateTimeBetween('-30 days', 'now')),
            'report_type' => 'daily',
            'impressions' => $impressions,
            'clicks' => $clicks,
            'spend' => $spend,
            'ctr' => $ctr,
            'cpm' => $cpm,
            'cpc' => $cpc,
            'metadata' => null,
            'generated_at' => Carbon::now(),
        ];
    }
}

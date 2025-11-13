<?php

namespace App\Services\Ads;

use App\Models\Ads\Ad;
use App\Models\Ads\AdCampaign;
use App\Models\Ads\AdPlacement;
use App\Models\Ads\AdReport;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AdReportingService
{
    /**
     * Generate daily report for a specific date.
     */
    public function generateDailyReport(Carbon $date): void
    {
        $startOfDay = $date->copy()->startOfDay();
        $endOfDay = $date->copy()->endOfDay();

        // Get all active ads
        $ads = Ad::query()
            ->where('status', 'active')
            ->get();

        foreach ($ads as $ad) {
            $this->generateAdReport($ad, $startOfDay, $endOfDay, 'daily');
        }

        // Generate campaign reports
        $campaigns = AdCampaign::query()
            ->where('status', 'active')
            ->get();

        foreach ($campaigns as $campaign) {
            $this->generateCampaignReport($campaign, $startOfDay, $endOfDay, 'daily');
        }
    }

    /**
     * Get report for a specific ad.
     *
     * @return array<string, mixed>
     */
    public function getAdReport(Ad $ad, Carbon $startDate, Carbon $endDate): array
    {
        $impressions = $ad->impressions()
            ->whereBetween('viewed_at', [$startDate, $endDate])
            ->count();

        $clicks = $ad->clicks()
            ->whereBetween('clicked_at', [$startDate, $endDate])
            ->count();

        $spend = $ad->reports()
            ->whereBetween('report_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->sum('spend');

        $metrics = $this->calculateMetrics($ad, $startDate, $endDate);

        return [
            'ad_id' => $ad->getKey(),
            'impressions' => $impressions,
            'clicks' => $clicks,
            'spend' => $spend,
            ...$metrics,
        ];
    }

    /**
     * Get campaign-level report.
     *
     * @return array<string, mixed>
     */
    public function getCampaignReport(AdCampaign $campaign, Carbon $startDate, Carbon $endDate): array
    {
        $impressions = DB::table('ad_impressions')
            ->join('ads', 'ad_impressions.ad_id', '=', 'ads.id')
            ->where('ads.campaign_id', $campaign->getKey())
            ->whereBetween('ad_impressions.viewed_at', [$startDate, $endDate])
            ->count();

        $clicks = DB::table('ad_clicks')
            ->join('ads', 'ad_clicks.ad_id', '=', 'ads.id')
            ->where('ads.campaign_id', $campaign->getKey())
            ->whereBetween('ad_clicks.clicked_at', [$startDate, $endDate])
            ->count();

        $spend = $campaign->reports()
            ->whereBetween('report_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->sum('spend');

        $ctr = $impressions > 0 ? round($clicks / $impressions, 4) : 0;
        $cpm = $impressions > 0 ? round(($spend / $impressions) * 1000) : null;
        $cpc = $clicks > 0 ? round($spend / $clicks) : null;

        return [
            'campaign_id' => $campaign->getKey(),
            'impressions' => $impressions,
            'clicks' => $clicks,
            'spend' => $spend,
            'ctr' => $ctr,
            'cpm' => $cpm,
            'cpc' => $cpc,
        ];
    }

    /**
     * Get placement-level report.
     *
     * @return array<string, mixed>
     */
    public function getPlacementReport(AdPlacement $placement, Carbon $startDate, Carbon $endDate): array
    {
        $impressions = DB::table('ad_impressions')
            ->where('placement', $placement->key)
            ->whereBetween('viewed_at', [$startDate, $endDate])
            ->count();

        $clicks = DB::table('ad_clicks')
            ->where('placement', $placement->key)
            ->whereBetween('clicked_at', [$startDate, $endDate])
            ->count();

        $spend = DB::table('ad_reports')
            ->where('placement', $placement->key)
            ->whereBetween('report_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->sum('spend');

        $ctr = $impressions > 0 ? round($clicks / $impressions, 4) : 0;
        $cpm = $impressions > 0 ? round(($spend / $impressions) * 1000) : null;
        $cpc = $clicks > 0 ? round($spend / $clicks) : null;

        return [
            'placement' => $placement->key,
            'impressions' => $impressions,
            'clicks' => $clicks,
            'spend' => $spend,
            'ctr' => $ctr,
            'cpm' => $cpm,
            'cpc' => $cpc,
        ];
    }

    /**
     * Calculate metrics for an ad.
     *
     * @return array<string, mixed>
     */
    public function calculateMetrics(Ad $ad, Carbon $startDate, Carbon $endDate): array
    {
        $impressions = $ad->impressions()
            ->whereBetween('viewed_at', [$startDate, $endDate])
            ->count();

        $clicks = $ad->clicks()
            ->whereBetween('clicked_at', [$startDate, $endDate])
            ->count();

        $spend = $ad->reports()
            ->whereBetween('report_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->sum('spend');

        $ctr = $impressions > 0 ? round($clicks / $impressions, 4) : 0;
        $cpm = $impressions > 0 ? round(($spend / $impressions) * 1000) : null;
        $cpc = $clicks > 0 ? round($spend / $clicks) : null;

        return [
            'ctr' => $ctr,
            'cpm' => $cpm,
            'cpc' => $cpc,
        ];
    }

    /**
     * Generate report for a specific ad and date range.
     */
    private function generateAdReport(Ad $ad, Carbon $startDate, Carbon $endDate, string $reportType): void
    {
        $report = $this->getAdReport($ad, $startDate, $endDate);

        AdReport::updateOrCreate(
            [
                'ad_id' => $ad->getKey(),
                'report_date' => $startDate->toDateString(),
                'report_type' => $reportType,
            ],
            [
                'impressions' => $report['impressions'],
                'clicks' => $report['clicks'],
                'spend' => $report['spend'],
                'ctr' => $report['ctr'],
                'cpm' => $report['cpm'],
                'cpc' => $report['cpc'],
                'generated_at' => now(),
            ]
        );
    }

    /**
     * Generate report for a campaign.
     */
    private function generateCampaignReport(AdCampaign $campaign, Carbon $startDate, Carbon $endDate, string $reportType): void
    {
        $report = $this->getCampaignReport($campaign, $startDate, $endDate);

        AdReport::updateOrCreate(
            [
                'campaign_id' => $campaign->getKey(),
                'report_date' => $startDate->toDateString(),
                'report_type' => $reportType,
            ],
            [
                'impressions' => $report['impressions'],
                'clicks' => $report['clicks'],
                'spend' => $report['spend'],
                'ctr' => $report['ctr'],
                'cpm' => $report['cpm'],
                'cpc' => $report['cpc'],
                'generated_at' => now(),
            ]
        );
    }
}

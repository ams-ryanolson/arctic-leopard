<?php

use App\Enums\Ads\AdPlacement;
use App\Models\Ads\Ad;
use App\Models\Ads\AdCampaign;
use App\Models\Ads\AdClick;
use App\Models\Ads\AdImpression;
use App\Models\Ads\AdReport;
use App\Services\Ads\AdReportingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->service = app(AdReportingService::class);
});

it('calculates metrics correctly', function (): void {
    $ad = Ad::factory()->active()->create();
    $startDate = Carbon::now()->subDays(7);
    $endDate = Carbon::now();

    // Create impressions and clicks
    AdImpression::factory()->count(1000)->create([
        'ad_id' => $ad->getKey(),
        'viewed_at' => $startDate->copy()->addDays(3),
    ]);

    AdClick::factory()->count(50)->create([
        'ad_id' => $ad->getKey(),
        'clicked_at' => $startDate->copy()->addDays(3),
    ]);

    $metrics = $this->service->calculateMetrics($ad, $startDate, $endDate);

    expect($metrics['ctr'])->toBe(0.05) // 50 / 1000
        ->and($metrics['cpm'])->toBeNull() // No spend yet
        ->and($metrics['cpc'])->toBeNull(); // No spend yet
});

it('generates daily report for active ads', function (): void {
    $ad = Ad::factory()->active()->create();
    $date = Carbon::yesterday();

    AdImpression::factory()->count(500)->create([
        'ad_id' => $ad->getKey(),
        'viewed_at' => $date,
    ]);

    AdClick::factory()->count(25)->create([
        'ad_id' => $ad->getKey(),
        'clicked_at' => $date,
    ]);

    $this->service->generateDailyReport($date);

    $report = AdReport::query()
        ->where('ad_id', $ad->getKey())
        ->where('report_date', $date->toDateString())
        ->first();

    expect($report)->not()->toBeNull()
        ->and($report->impressions)->toBe(500)
        ->and($report->clicks)->toBe(25)
        ->and($report->ctr)->toBe(0.05);
});

it('generates campaign report correctly', function (): void {
    $campaign = AdCampaign::factory()->create();
    $ad1 = Ad::factory()->active()->create(['campaign_id' => $campaign->getKey()]);
    $ad2 = Ad::factory()->active()->create(['campaign_id' => $campaign->getKey()]);

    $startDate = Carbon::now()->subDays(7);
    $endDate = Carbon::now();

    AdImpression::factory()->count(100)->create([
        'ad_id' => $ad1->getKey(),
        'viewed_at' => $startDate->copy()->addDays(3),
    ]);

    AdImpression::factory()->count(200)->create([
        'ad_id' => $ad2->getKey(),
        'viewed_at' => $startDate->copy()->addDays(3),
    ]);

    AdClick::factory()->count(15)->create([
        'ad_id' => $ad1->getKey(),
        'clicked_at' => $startDate->copy()->addDays(3),
    ]);

    $report = $this->service->getCampaignReport($campaign, $startDate, $endDate);

    expect($report['impressions'])->toBe(300)
        ->and($report['clicks'])->toBe(15)
        ->and($report['ctr'])->toBe(0.05);
});

it('generates placement report correctly', function (): void {
    $ad = Ad::factory()->active()->create();
    $creative = $ad->creatives()->create([
        'placement' => AdPlacement::TimelineInline,
        'size' => 'medium',
        'asset_type' => 'image',
        'cta_url' => 'https://example.com',
        'is_active' => true,
        'review_status' => 'approved',
    ]);

    $startDate = Carbon::now()->subDays(7);
    $endDate = Carbon::now();

    AdImpression::factory()->count(500)->create([
        'ad_id' => $ad->getKey(),
        'ad_creative_id' => $creative->id,
        'placement' => AdPlacement::TimelineInline,
        'viewed_at' => $startDate->copy()->addDays(3),
    ]);

    AdClick::factory()->count(25)->create([
        'ad_id' => $ad->getKey(),
        'ad_creative_id' => $creative->id,
        'placement' => AdPlacement::TimelineInline,
        'clicked_at' => $startDate->copy()->addDays(3),
    ]);

    $report = $this->service->getPlacementReport(AdPlacement::TimelineInline, $startDate, $endDate);

    expect($report['impressions'])->toBe(500)
        ->and($report['clicks'])->toBe(25)
        ->and($report['ctr'])->toBe(0.05);
});

it('handles zero impressions gracefully', function (): void {
    $ad = Ad::factory()->active()->create();
    $startDate = Carbon::now()->subDays(7);
    $endDate = Carbon::now();

    $metrics = $this->service->calculateMetrics($ad, $startDate, $endDate);

    expect($metrics['ctr'])->toBe(0.0)
        ->and($metrics['cpm'])->toBeNull()
        ->and($metrics['cpc'])->toBeNull();
});

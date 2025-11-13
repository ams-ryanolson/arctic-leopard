<?php

use App\Enums\Ads\AdPlacement;
use App\Enums\Ads\AdStatus;
use App\Models\Ads\Ad;
use App\Models\Ads\AdCreative;
use App\Models\User;
use App\Services\Ads\AdServingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

it('serves an ad for a placement', function (): void {
    $advertiser = User::factory()->create();
    $ad = Ad::factory()->active()->create([
        'advertiser_id' => $advertiser->getKey(),
        'start_date' => Carbon::now()->subDay(),
        'end_date' => Carbon::now()->addDays(30),
    ]);

    $creative = AdCreative::factory()->create([
        'ad_id' => $ad->getKey(),
        'placement' => AdPlacement::TimelineInline,
        'is_active' => true,
        'review_status' => 'approved',
    ]);

    $service = app(AdServingService::class);
    $served = $service->serve(AdPlacement::TimelineInline, null);

    expect($served)->not()->toBeNull()
        ->and($served->id)->toBe($creative->id);
});

it('does not serve expired ads', function (): void {
    $advertiser = User::factory()->create();
    $ad = Ad::factory()->create([
        'advertiser_id' => $advertiser->getKey(),
        'status' => AdStatus::Active,
        'start_date' => Carbon::now()->subDays(10),
        'end_date' => Carbon::now()->subDay(), // Expired
    ]);

    AdCreative::factory()->create([
        'ad_id' => $ad->getKey(),
        'placement' => AdPlacement::TimelineInline,
        'is_active' => true,
        'review_status' => 'approved',
    ]);

    $service = app(AdServingService::class);
    $served = $service->serve(AdPlacement::TimelineInline, null);

    expect($served)->toBeNull();
});

it('does not serve ads that exceed budget', function (): void {
    $advertiser = User::factory()->create();
    $ad = Ad::factory()->active()->create([
        'advertiser_id' => $advertiser->getKey(),
        'budget_amount' => 10000,
        'spent_amount' => 10000, // Budget exhausted
    ]);

    AdCreative::factory()->create([
        'ad_id' => $ad->getKey(),
        'placement' => AdPlacement::TimelineInline,
        'is_active' => true,
        'review_status' => 'approved',
    ]);

    $service = app(AdServingService::class);
    $served = $service->serve(AdPlacement::TimelineInline, null);

    expect($served)->toBeNull();
});

it('records impressions asynchronously', function (): void {
    $advertiser = User::factory()->create();
    $ad = Ad::factory()->active()->create([
        'advertiser_id' => $advertiser->getKey(),
    ]);

    $creative = AdCreative::factory()->create([
        'ad_id' => $ad->getKey(),
        'placement' => AdPlacement::TimelineInline,
        'is_active' => true,
        'review_status' => 'approved',
    ]);

    $service = app(AdServingService::class);
    $impression = $service->recordImpression($creative, AdPlacement::TimelineInline, null);

    expect($impression)->not()->toBeNull()
        ->and($impression->ad_id)->toBe($ad->getKey())
        ->and($impression->ad_creative_id)->toBe($creative->getKey());
});

it('records clicks asynchronously', function (): void {
    $advertiser = User::factory()->create();
    $ad = Ad::factory()->active()->create([
        'advertiser_id' => $advertiser->getKey(),
    ]);

    $creative = AdCreative::factory()->create([
        'ad_id' => $ad->getKey(),
        'placement' => AdPlacement::TimelineInline,
        'is_active' => true,
        'review_status' => 'approved',
    ]);

    $service = app(AdServingService::class);
    $click = $service->recordClick($creative, AdPlacement::TimelineInline, null);

    expect($click)->not()->toBeNull()
        ->and($click->ad_id)->toBe($ad->getKey())
        ->and($click->ad_creative_id)->toBe($creative->getKey());
});

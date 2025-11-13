<?php

use App\Enums\Ads\PricingModel;
use App\Models\Ads\Ad;
use App\Services\Ads\AdPricingService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->service = app(AdPricingService::class);
});

it('calculates CPM cost correctly', function (): void {
    $ad = Ad::factory()->create([
        'pricing_model' => PricingModel::Cpm,
        'pricing_rate' => 500, // $5.00 per 1000 impressions
    ]);

    $cost = $this->service->calculateCost($ad, 1000, 0);

    expect($cost)->toBe(500); // $5.00
});

it('calculates CPC cost correctly', function (): void {
    $ad = Ad::factory()->create([
        'pricing_model' => PricingModel::Cpc,
        'pricing_rate' => 50, // $0.50 per click
    ]);

    $cost = $this->service->calculateCost($ad, 0, 10);

    expect($cost)->toBe(500); // 10 clicks * $0.50 = $5.00
});

it('calculates flat rate cost correctly', function (): void {
    $ad = Ad::factory()->create([
        'pricing_model' => PricingModel::Flat,
        'pricing_rate' => 10000, // $100.00 flat rate
    ]);

    $cost = $this->service->calculateCost($ad, 1000, 50);

    expect($cost)->toBe(10000); // Flat rate regardless of impressions/clicks
});

it('returns true when budget is available', function (): void {
    $ad = Ad::factory()->create([
        'budget_amount' => 10000,
        'spent_amount' => 5000,
    ]);

    $result = $this->service->checkBudget($ad);

    expect($result)->toBeTrue();
});

it('returns false when budget is exhausted', function (): void {
    $ad = Ad::factory()->create([
        'budget_amount' => 10000,
        'spent_amount' => 10000,
    ]);

    $result = $this->service->checkBudget($ad);

    expect($result)->toBeFalse();
});

it('returns false when spent exceeds budget', function (): void {
    $ad = Ad::factory()->create([
        'budget_amount' => 10000,
        'spent_amount' => 15000,
    ]);

    $result = $this->service->checkBudget($ad);

    expect($result)->toBeFalse();
});

it('updates spend atomically', function (): void {
    $ad = Ad::factory()->create([
        'budget_amount' => 10000,
        'spent_amount' => 5000,
    ]);

    $this->service->updateSpend($ad, 1000);

    $ad->refresh();

    expect($ad->spent_amount)->toBe(6000);
});

it('estimates reach for CPM pricing', function (): void {
    $ad = Ad::factory()->create([
        'pricing_model' => PricingModel::Cpm,
        'pricing_rate' => 500, // $5.00 per 1000 impressions
    ]);

    $reach = $this->service->getEstimatedReach($ad, 5000); // $50.00 budget

    expect($reach)->toBe(10000); // 10,000 impressions
});

it('returns zero reach for CPC pricing', function (): void {
    $ad = Ad::factory()->create([
        'pricing_model' => PricingModel::Cpc,
        'pricing_rate' => 50,
    ]);

    $reach = $this->service->getEstimatedReach($ad, 5000);

    expect($reach)->toBe(0);
});

it('returns zero reach for flat rate pricing', function (): void {
    $ad = Ad::factory()->create([
        'pricing_model' => PricingModel::Flat,
        'pricing_rate' => 10000,
    ]);

    $reach = $this->service->getEstimatedReach($ad, 5000);

    expect($reach)->toBe(0);
});

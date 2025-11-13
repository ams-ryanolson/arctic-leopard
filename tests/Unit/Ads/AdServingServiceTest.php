<?php

use App\Enums\Ads\AdPlacement;
use App\Models\Ads\Ad;
use App\Models\Ads\AdCreative;
use App\Models\User;
use App\Services\Ads\AdPricingService;
use App\Services\Ads\AdServingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->pricingService = $this->mock(AdPricingService::class);
    $this->service = new AdServingService($this->pricingService);
});

it('returns null when no eligible ads exist', function (): void {
    $result = $this->service->serve(AdPlacement::TimelineInline, null);

    expect($result)->toBeNull();
});

it('returns null when ad budget is exhausted', function (): void {
    $ad = Ad::factory()->active()->create([
        'budget_amount' => 10000,
        'spent_amount' => 10000,
    ]);

    AdCreative::factory()->create([
        'ad_id' => $ad->getKey(),
        'placement' => AdPlacement::TimelineInline,
        'is_active' => true,
        'review_status' => 'approved',
    ]);

    $this->pricingService->shouldReceive('checkBudget')
        ->with(\Mockery::on(fn ($arg) => $arg->id === $ad->id))
        ->andReturn(false);

    $result = $this->service->serve(AdPlacement::TimelineInline, null);

    expect($result)->toBeNull();
});

it('returns null when ad is expired', function (): void {
    $ad = Ad::factory()->active()->create([
        'start_date' => Carbon::now()->subDays(10),
        'end_date' => Carbon::now()->subDay(),
    ]);

    AdCreative::factory()->create([
        'ad_id' => $ad->getKey(),
        'placement' => AdPlacement::TimelineInline,
        'is_active' => true,
        'review_status' => 'approved',
    ]);

    $this->pricingService->shouldReceive('checkBudget')
        ->andReturn(true);

    $result = $this->service->serve(AdPlacement::TimelineInline, null);

    expect($result)->toBeNull();
});

it('returns null when ad has not started', function (): void {
    $ad = Ad::factory()->active()->create([
        'start_date' => Carbon::now()->addDay(),
        'end_date' => Carbon::now()->addDays(30),
    ]);

    AdCreative::factory()->create([
        'ad_id' => $ad->getKey(),
        'placement' => AdPlacement::TimelineInline,
        'is_active' => true,
        'review_status' => 'approved',
    ]);

    $this->pricingService->shouldReceive('checkBudget')
        ->andReturn(true);

    $result = $this->service->serve(AdPlacement::TimelineInline, null);

    expect($result)->toBeNull();
});

it('returns null when daily impression cap is reached', function (): void {
    Queue::fake();

    $user = User::factory()->create();
    $ad = Ad::factory()->active()->create([
        'start_date' => Carbon::now()->subDay(),
        'end_date' => Carbon::now()->addDays(30),
        'daily_impression_cap' => 3,
    ]);

    AdCreative::factory()->create([
        'ad_id' => $ad->getKey(),
        'placement' => AdPlacement::TimelineInline,
        'is_active' => true,
        'review_status' => 'approved',
    ]);

    // Create 3 impressions for today
    $ad->impressions()->createMany([
        ['ad_creative_id' => $ad->creatives->first()->id, 'placement' => AdPlacement::TimelineInline, 'user_id' => $user->id, 'viewed_at' => Carbon::today()],
        ['ad_creative_id' => $ad->creatives->first()->id, 'placement' => AdPlacement::TimelineInline, 'user_id' => $user->id, 'viewed_at' => Carbon::today()],
        ['ad_creative_id' => $ad->creatives->first()->id, 'placement' => AdPlacement::TimelineInline, 'user_id' => $user->id, 'viewed_at' => Carbon::today()],
    ]);

    $this->pricingService->shouldReceive('checkBudget')
        ->andReturn(true);

    $result = $this->service->serve(AdPlacement::TimelineInline, $user);

    expect($result)->toBeNull();
});

it('returns null when targeting requires auth but viewer is null', function (): void {
    $ad = Ad::factory()->active()->create([
        'start_date' => Carbon::now()->subDay(),
        'end_date' => Carbon::now()->addDays(30),
        'targeting' => ['require_auth' => true],
    ]);

    AdCreative::factory()->create([
        'ad_id' => $ad->getKey(),
        'placement' => AdPlacement::TimelineInline,
        'is_active' => true,
        'review_status' => 'approved',
    ]);

    $this->pricingService->shouldReceive('checkBudget')
        ->andReturn(true);

    $result = $this->service->serve(AdPlacement::TimelineInline, null);

    expect($result)->toBeNull();
});

it('returns creative when ad is eligible', function (): void {
    $ad = Ad::factory()->active()->create([
        'start_date' => Carbon::now()->subDay(),
        'end_date' => Carbon::now()->addDays(30),
    ]);

    $creative = AdCreative::factory()->create([
        'ad_id' => $ad->getKey(),
        'placement' => AdPlacement::TimelineInline,
        'is_active' => true,
        'review_status' => 'approved',
    ]);

    $this->pricingService->shouldReceive('checkBudget')
        ->andReturn(true);

    $result = $this->service->serve(AdPlacement::TimelineInline, null);

    expect($result)->not()->toBeNull()
        ->and($result->id)->toBe($creative->id);
});

it('queues impression logging job', function (): void {
    Queue::fake();

    $creative = AdCreative::factory()->create([
        'placement' => AdPlacement::TimelineInline,
    ]);

    $this->service->recordImpression($creative, AdPlacement::TimelineInline, null);

    Queue::assertPushed(\App\Jobs\Ads\LogAdImpression::class);
});

it('queues click logging job', function (): void {
    Queue::fake();

    $creative = AdCreative::factory()->create([
        'placement' => AdPlacement::TimelineInline,
    ]);

    $this->service->recordClick($creative, AdPlacement::TimelineInline, null);

    Queue::assertPushed(\App\Jobs\Ads\LogAdClick::class);
});

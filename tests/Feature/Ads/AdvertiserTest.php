<?php

use App\Enums\Ads\AdStatus;
use App\Models\Ads\Ad;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows advertisers to create ads', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/signals/ads', [
            'name' => 'My First Ad',
            'budget_amount' => 5000,
            'budget_currency' => 'USD',
            'pricing_model' => 'cpm',
            'pricing_rate' => 500,
            'creatives' => [
                [
                    'placement' => 'timeline_inline',
                    'size' => 'medium',
                    'asset_type' => 'image',
                    'asset_url' => 'https://example.com/ad.jpg',
                    'cta_url' => 'https://example.com',
                ],
            ],
        ])
        ->assertCreated();

    $ad = Ad::query()->first();

    expect($ad)->not()->toBeNull()
        ->and($ad->advertiser_id)->toBe($user->getKey())
        ->and($ad->status)->toBe(AdStatus::PendingReview);
});

it('allows advertisers to view their own ads', function (): void {
    $user = User::factory()->create();
    $ad = Ad::factory()->create([
        'advertiser_id' => $user->getKey(),
    ]);

    $this->actingAs($user)
        ->get("/signals/ads/{$ad->id}")
        ->assertOk();
});

it('prevents advertisers from viewing other ads', function (): void {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $ad = Ad::factory()->create([
        'advertiser_id' => $otherUser->getKey(),
    ]);

    $this->actingAs($user)
        ->get("/signals/ads/{$ad->id}")
        ->assertForbidden();
});

it('allows advertisers to update their own draft ads', function (): void {
    $user = User::factory()->create();
    $ad = Ad::factory()->create([
        'advertiser_id' => $user->getKey(),
        'status' => AdStatus::Draft,
    ]);

    $this->actingAs($user)
        ->putJson("/signals/ads/{$ad->id}", [
            'name' => 'Updated Ad Name',
        ])
        ->assertOk();

    $ad->refresh();

    expect($ad->name)->toBe('Updated Ad Name');
});

it('prevents advertisers from updating active ads', function (): void {
    $user = User::factory()->create();
    $ad = Ad::factory()->active()->create([
        'advertiser_id' => $user->getKey(),
    ]);

    $this->actingAs($user)
        ->putJson("/signals/ads/{$ad->id}", [
            'name' => 'Updated Ad Name',
        ])
        ->assertForbidden();
});

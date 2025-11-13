<?php

use App\Enums\Ads\AdStatus;
use App\Models\Ads\Ad;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

it('allows admins to view ads index', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    Ad::factory()->count(3)->create();

    $this->actingAs($admin)
        ->get('/admin/ads')
        ->assertOk();
});

it('allows admins to create ads', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $this->actingAs($admin)
        ->postJson('/admin/ads', [
            'name' => 'Test Ad',
            'budget_amount' => 10000,
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

    expect(Ad::query()->count())->toBe(1);
});

it('allows admins to approve ads', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $ad = Ad::factory()->create([
        'status' => AdStatus::PendingReview,
    ]);

    $this->actingAs($admin)
        ->postJson("/admin/ads/{$ad->id}/approve")
        ->assertOk();

    $ad->refresh();

    expect($ad->status)->toBe(AdStatus::Active)
        ->and($ad->approved_at)->not()->toBeNull()
        ->and($ad->approved_by)->toBe($admin->getKey());
});

it('allows admins to reject ads', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $ad = Ad::factory()->create([
        'status' => AdStatus::PendingReview,
    ]);

    $this->actingAs($admin)
        ->postJson("/admin/ads/{$ad->id}/reject", [
            'reason' => 'Content violates policy',
        ])
        ->assertOk();

    $ad->refresh();

    expect($ad->status)->toBe(AdStatus::Rejected)
        ->and($ad->rejected_at)->not()->toBeNull()
        ->and($ad->rejection_reason)->toBe('Content violates policy');
});

it('allows admins to pause and resume ads', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $ad = Ad::factory()->active()->create([
        'approved_at' => Carbon::now(),
        'approved_by' => $admin->getKey(),
    ]);

    $this->actingAs($admin)
        ->postJson("/admin/ads/{$ad->id}/pause")
        ->assertOk();

    $ad->refresh();

    expect($ad->status)->toBe(AdStatus::Paused);

    $this->actingAs($admin)
        ->postJson("/admin/ads/{$ad->id}/resume")
        ->assertOk();

    $ad->refresh();

    expect($ad->status)->toBe(AdStatus::Active);
});

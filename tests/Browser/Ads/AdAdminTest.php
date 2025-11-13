<?php

use App\Enums\Ads\AdStatus;
use App\Models\Ads\Ad;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can view ads index', function (): void {
    if (! function_exists('visit')) {
        $this->markTestSkipped('Browser plugin not installed. Install pestphp/pest-plugin-browser and Playwright to enable browser tests.');
    }

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    Ad::factory()->count(3)->create();

    $this->actingAs($admin);

    $page = visit('/admin/ads');

    $page->assertSee('Ads')
        ->assertNoJavascriptErrors();
});

test('admin can approve an ad', function (): void {
    if (! function_exists('visit')) {
        $this->markTestSkipped('Browser plugin not installed. Install pestphp/pest-plugin-browser and Playwright to enable browser tests.');
    }

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $ad = Ad::factory()->create([
        'status' => AdStatus::PendingReview,
    ]);

    $this->actingAs($admin);

    $page = visit("/admin/ads/{$ad->id}");

    $page->assertSee($ad->name)
        ->click('Approve')
        ->waitForText('Approved', timeout: 3);

    $ad->refresh();

    expect($ad->status)->toBe(AdStatus::Active);
});

test('admin can reject an ad', function (): void {
    if (! function_exists('visit')) {
        $this->markTestSkipped('Browser plugin not installed. Install pestphp/pest-plugin-browser and Playwright to enable browser tests.');
    }

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $ad = Ad::factory()->create([
        'status' => AdStatus::PendingReview,
    ]);

    $this->actingAs($admin);

    $page = visit("/admin/ads/{$ad->id}");

    $page->assertSee($ad->name)
        ->click('Reject')
        ->fill('reason', 'Content violates policy')
        ->click('Confirm Rejection')
        ->waitForText('Rejected', timeout: 3);

    $ad->refresh();

    expect($ad->status)->toBe(AdStatus::Rejected)
        ->and($ad->rejection_reason)->toBe('Content violates policy');
});

test('admin can pause and resume an ad', function (): void {
    if (! function_exists('visit')) {
        $this->markTestSkipped('Browser plugin not installed. Install pestphp/pest-plugin-browser and Playwright to enable browser tests.');
    }

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $ad = Ad::factory()->active()->create();

    $this->actingAs($admin);

    $page = visit("/admin/ads/{$ad->id}");

    $page->assertSee($ad->name)
        ->click('Pause')
        ->waitForText('Paused', timeout: 3);

    $ad->refresh();

    expect($ad->status)->toBe(AdStatus::Paused);

    $page->click('Resume')
        ->waitForText('Active', timeout: 3);

    $ad->refresh();

    expect($ad->status)->toBe(AdStatus::Active);
});

<?php

use App\Enums\Ads\AdStatus;
use App\Models\Ads\Ad;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('advertiser can view their ads', function (): void {
    if (! function_exists('visit')) {
        $this->markTestSkipped('Browser plugin not installed. Install pestphp/pest-plugin-browser and Playwright to enable browser tests.');
    }

    $user = User::factory()->create();
    $ad = Ad::factory()->create([
        'advertiser_id' => $user->getKey(),
    ]);

    $this->actingAs($user);

    $page = visit('/signals/ads');

    $page->assertSee('My Ads')
        ->assertSee($ad->name)
        ->assertNoJavascriptErrors();
});

test('advertiser can create a new ad', function (): void {
    if (! function_exists('visit')) {
        $this->markTestSkipped('Browser plugin not installed. Install pestphp/pest-plugin-browser and Playwright to enable browser tests.');
    }

    $user = User::factory()->create();

    $this->actingAs($user);

    $page = visit('/signals/ads/create');

    $page->assertSee('Create Ad')
        ->fill('name', 'My New Ad')
        ->fill('budget_amount', '10000')
        ->fill('pricing_rate', '500')
        ->click('Create Ad')
        ->waitForText('Ad created successfully', timeout: 3);

    expect(Ad::query()->where('advertiser_id', $user->getKey())->count())->toBe(1);
});

test('advertiser can view ad details', function (): void {
    if (! function_exists('visit')) {
        $this->markTestSkipped('Browser plugin not installed. Install pestphp/pest-plugin-browser and Playwright to enable browser tests.');
    }

    $user = User::factory()->create();
    $ad = Ad::factory()->create([
        'advertiser_id' => $user->getKey(),
        'status' => AdStatus::PendingReview,
    ]);

    $this->actingAs($user);

    $page = visit("/signals/ads/{$ad->id}");

    $page->assertSee($ad->name)
        ->assertSee('Pending Review')
        ->assertNoJavascriptErrors();
});

test('advertiser can edit draft ad', function (): void {
    if (! function_exists('visit')) {
        $this->markTestSkipped('Browser plugin not installed. Install pestphp/pest-plugin-browser and Playwright to enable browser tests.');
    }

    $user = User::factory()->create();
    $ad = Ad::factory()->create([
        'advertiser_id' => $user->getKey(),
        'status' => AdStatus::Draft,
        'name' => 'Original Name',
    ]);

    $this->actingAs($user);

    $page = visit("/signals/ads/{$ad->id}/edit");

    $page->assertSee('Edit Ad')
        ->fill('name', 'Updated Name')
        ->click('Update Ad')
        ->waitForText('Ad updated successfully', timeout: 3);

    $ad->refresh();

    expect($ad->name)->toBe('Updated Name');
});

<?php

use App\Enums\Ads\AdPlacement;
use App\Models\Ads\Ad;
use App\Models\Ads\AdCreative;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

test('dashboard displays sidebar ad', function (): void {
    if (! function_exists('visit')) {
        $this->markTestSkipped('Browser plugin not installed. Install pestphp/pest-plugin-browser and Playwright to enable browser tests.');
    }

    $user = User::factory()->create();
    $ad = Ad::factory()->active()->create([
        'start_date' => Carbon::now()->subDay(),
        'end_date' => Carbon::now()->addDays(30),
    ]);

    AdCreative::factory()->create([
        'ad_id' => $ad->getKey(),
        'placement' => AdPlacement::DashboardSidebarLarge,
        'is_active' => true,
        'review_status' => 'approved',
        'headline' => 'Test Ad Headline',
        'cta_text' => 'Learn More',
        'cta_url' => 'https://example.com',
    ]);

    $this->actingAs($user);

    $page = visit('/dashboard');

    $page->assertSee('Test Ad Headline')
        ->assertSee('Learn More');
});

test('timeline feed injects ads every N posts', function (): void {
    if (! function_exists('visit')) {
        $this->markTestSkipped('Browser plugin not installed. Install pestphp/pest-plugin-browser and Playwright to enable browser tests.');
    }

    $user = User::factory()->create();
    $ad = Ad::factory()->active()->create([
        'start_date' => Carbon::now()->subDay(),
        'end_date' => Carbon::now()->addDays(30),
    ]);

    AdCreative::factory()->create([
        'ad_id' => $ad->getKey(),
        'placement' => AdPlacement::TimelineInline,
        'is_active' => true,
        'review_status' => 'approved',
        'headline' => 'Timeline Ad',
    ]);

    // Create multiple posts to trigger ad injection
    \App\Models\Post::factory()->count(10)->create();

    $this->actingAs($user);

    $page = visit('/dashboard');

    // Scroll to load more posts and trigger ad injection
    $page->scroll(0, 1000)
        ->waitForText('Timeline Ad', timeout: 5);
});

test('ad click tracking works', function (): void {
    if (! function_exists('visit')) {
        $this->markTestSkipped('Browser plugin not installed. Install pestphp/pest-plugin-browser and Playwright to enable browser tests.');
    }

    $user = User::factory()->create();
    $ad = Ad::factory()->active()->create([
        'start_date' => Carbon::now()->subDay(),
        'end_date' => Carbon::now()->addDays(30),
    ]);

    $creative = AdCreative::factory()->create([
        'ad_id' => $ad->getKey(),
        'placement' => AdPlacement::DashboardSidebarLarge,
        'is_active' => true,
        'review_status' => 'approved',
        'cta_url' => 'https://example.com',
    ]);

    $this->actingAs($user);

    $page = visit('/dashboard');

    // Click on the ad CTA
    $page->click('Learn More')
        ->waitForNavigation();

    // Verify click was recorded
    expect($ad->clicks()->count())->toBeGreaterThan(0);
});

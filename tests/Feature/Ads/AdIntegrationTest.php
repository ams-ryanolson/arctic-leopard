<?php

use App\Enums\Ads\AdPlacement;
use App\Models\Ads\Ad;
use App\Models\Ads\AdCreative;
use App\Models\Post;
use App\Models\User;
use App\Services\Feed\FeedService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

it('injects ads into timeline feed', function (): void {
    $user = User::factory()->create();
    Post::factory()->count(10)->create();

    $ad = Ad::factory()->active()->create([
        'start_date' => Carbon::now()->subDay(),
        'end_date' => Carbon::now()->addDays(30),
    ]);

    AdCreative::factory()->create([
        'ad_id' => $ad->getKey(),
        'placement' => AdPlacement::TimelineInline,
        'is_active' => true,
        'review_status' => 'approved',
    ]);

    $service = app(FeedService::class);
    $request = Request::create('/dashboard');
    $request->setUserResolver(fn () => $user);

    $feed = $service->getFollowingFeed($user, 1, 20, $request, 'page');

    // Check that feed contains ad entries
    $hasAd = collect($feed['data'] ?? [])->contains(fn ($entry) => isset($entry['type']) && $entry['type'] === 'ad');

    expect($hasAd)->toBeTrue();
});

it('serves sidebar ads via API', function (): void {
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
    ]);

    $this->actingAs($user)
        ->getJson('/api/ads/dashboard_sidebar_large')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                'id',
                'ad_id',
                'placement',
                'cta_url',
            ],
        ]);
});

it('records impressions via API', function (): void {
    $user = User::factory()->create();
    $ad = Ad::factory()->active()->create();
    $creative = AdCreative::factory()->create([
        'ad_id' => $ad->getKey(),
        'placement' => AdPlacement::TimelineInline,
    ]);

    $this->actingAs($user)
        ->postJson("/api/ads/{$ad->id}/impressions", [
            'creative_id' => $creative->id,
            'placement' => 'timeline_inline',
        ])
        ->assertCreated();
});

it('records clicks via API', function (): void {
    $user = User::factory()->create();
    $ad = Ad::factory()->active()->create();
    $creative = AdCreative::factory()->create([
        'ad_id' => $ad->getKey(),
        'placement' => AdPlacement::TimelineInline,
    ]);

    $this->actingAs($user)
        ->postJson("/api/ads/{$ad->id}/clicks", [
            'creative_id' => $creative->id,
            'placement' => 'timeline_inline',
        ])
        ->assertCreated();
});

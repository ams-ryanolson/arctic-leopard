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
    // Create viewer user
    $viewer = User::factory()->create();

    // Create users that the viewer follows
    $followedUser1 = User::factory()->create();
    $followedUser2 = User::factory()->create();

    // Set up follow relationships
    $viewer->follow($followedUser1);
    $viewer->follow($followedUser2);

    // Create more than 6 posts (ads inject every 6 posts by default)
    // Posts must be Public to be visible, or viewer must follow author
    $posts = collect();
    for ($i = 0; $i < 8; $i++) {
        $author = $i % 2 === 0 ? $followedUser1 : $followedUser2;
        $post = Post::factory()->create([
            'user_id' => $author->getKey(),
            'published_at' => now()->subMinutes($i),
            'audience' => \App\Enums\PostAudience::Public->value, // Ensure posts are visible
        ]);
        $posts->push($post);
    }

    // Create Timeline entries for the viewer (simulating fan-out)
    foreach ($posts as $post) {
        \App\Models\Timeline::create([
            'user_id' => $viewer->getKey(),
            'post_id' => $post->getKey(),
            'visibility_source' => \App\Enums\TimelineVisibilitySource::Following->value,
            'context' => json_encode([]),
            'visible_at' => $post->published_at ?? now(),
        ]);
    }

    // Create active ad with timeline inline placement
    // Must have budget > spent_amount to be eligible
    $ad = Ad::factory()->active()->create([
        'start_date' => Carbon::now()->subDay(),
        'end_date' => Carbon::now()->addDays(30),
        'budget_amount' => 100000, // $1000.00 in cents
        'spent_amount' => 0,
        'budget_currency' => 'USD',
    ]);

    AdCreative::factory()->create([
        'ad_id' => $ad->getKey(),
        'placement' => AdPlacement::TimelineInline,
        'is_active' => true,
        'review_status' => 'approved',
    ]);

    // Get feed and check for ad injection
    $service = app(FeedService::class);

    // Create request - session will be handled by hasSession() check in FeedService
    $request = Request::create('/dashboard');
    $request->setUserResolver(fn () => $viewer);

    $feed = $service->getFollowingFeed($viewer, 1, 20, $request, 'page');

    // Check that feed contains ad entries (should appear after 6 posts)
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

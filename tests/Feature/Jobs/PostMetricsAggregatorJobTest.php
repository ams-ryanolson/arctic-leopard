<?php

use App\Jobs\PostMetricsAggregatorJob;
use App\Models\Post;
use App\Models\PostMetricDaily;
use App\Models\PostPurchase;
use App\Models\PostViewEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

it('aggregates daily metrics for posts', function (): void {
    Carbon::setTestNow('2025-01-01 09:00:00');

    $post = Post::factory()->create([
        'likes_count' => 3,
        'comments_count' => 2,
        'reposts_count' => 1,
        'poll_votes_count' => 4,
        'views_count' => 10,
    ]);

    $viewerOne = User::factory()->create();
    $viewerTwo = User::factory()->create();

    PostViewEvent::factory()->create([
        'post_id' => $post->getKey(),
        'viewer_id' => $viewerOne->getKey(),
        'fingerprint_hash' => 'auth-1',
        'country_code' => 'US',
        'occurred_at' => Carbon::now(),
    ]);

    PostViewEvent::factory()->create([
        'post_id' => $post->getKey(),
        'viewer_id' => $viewerOne->getKey(),
        'fingerprint_hash' => 'auth-1',
        'country_code' => 'US',
        'occurred_at' => Carbon::now()->addMinutes(5),
    ]);

    PostViewEvent::factory()->create([
        'post_id' => $post->getKey(),
        'viewer_id' => $viewerTwo->getKey(),
        'fingerprint_hash' => 'auth-2',
        'country_code' => 'CA',
        'occurred_at' => Carbon::now()->addMinutes(10),
    ]);

    PostViewEvent::factory()->create([
        'post_id' => $post->getKey(),
        'viewer_id' => null,
        'fingerprint_hash' => 'guest-1',
        'country_code' => 'US',
        'occurred_at' => Carbon::now()->addMinutes(15),
    ]);

    PostViewEvent::factory()->create([
        'post_id' => $post->getKey(),
        'viewer_id' => null,
        'fingerprint_hash' => 'guest-2',
        'country_code' => null,
        'occurred_at' => Carbon::now()->addMinutes(20),
    ]);

    PostPurchase::factory()->create([
        'post_id' => $post->getKey(),
        'created_at' => Carbon::now(),
    ]);

    $job = new PostMetricsAggregatorJob(Carbon::now());
    $job->handle();

    $metrics = PostMetricDaily::query()
        ->where('post_id', $post->getKey())
        ->whereDate('date', Carbon::now())
        ->first();

    expect($metrics)->not->toBeNull()
        ->and($metrics->likes)->toBe(3)
        ->and($metrics->comments)->toBe(2)
        ->and($metrics->reposts)->toBe(1)
        ->and($metrics->poll_votes)->toBe(4)
        ->and($metrics->views)->toBe(5)
        ->and($metrics->unique_viewers)->toBe(4)
        ->and($metrics->unique_authenticated_viewers)->toBe(2)
        ->and($metrics->unique_guest_viewers)->toBe(2)
        ->and($metrics->country_breakdown)->toMatchArray([
            'CA' => 1,
            'US' => 3,
        ])
        ->and($metrics->purchases)->toBe(1);
});

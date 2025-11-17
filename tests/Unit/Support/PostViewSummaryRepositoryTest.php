<?php

use App\Models\Post;
use App\Models\PostViewEvent;
use App\Models\User;
use App\Support\Analytics\PostViewSummaryRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

it('produces view summaries for multiple posts within a date range', function (): void {
    Carbon::setTestNow('2025-02-01 00:00:00');

    $postA = Post::factory()->create();
    $postB = Post::factory()->create();

    $viewer = User::factory()->create();

    PostViewEvent::factory()->create([
        'post_id' => $postA->getKey(),
        'viewer_id' => $viewer->getKey(),
        'fingerprint_hash' => 'hash-auth',
        'country_code' => 'US',
        'occurred_at' => Carbon::now()->addMinutes(10),
    ]);

    PostViewEvent::factory()->create([
        'post_id' => $postA->getKey(),
        'viewer_id' => null,
        'fingerprint_hash' => 'hash-guest',
        'country_code' => 'CA',
        'occurred_at' => Carbon::now()->addMinutes(20),
    ]);

    PostViewEvent::factory()->create([
        'post_id' => $postB->getKey(),
        'viewer_id' => null,
        'fingerprint_hash' => 'hash-other',
        'country_code' => null,
        'occurred_at' => Carbon::now()->addMinutes(30),
    ]);

    $repository = new PostViewSummaryRepository;

    $summaries = $repository->summarize(
        [$postA->getKey(), $postB->getKey()],
        Carbon::now()->startOfDay(),
        Carbon::now()->endOfDay()
    );

    expect($summaries->keys()->all())->toMatchArray([$postA->getKey(), $postB->getKey()]);

    $summaryA = $summaries->get($postA->getKey());
    $summaryB = $summaries->get($postB->getKey());

    expect($summaryA)
        ->toBeArray()
        ->and($summaryA['views'])->toBe(2)
        ->and($summaryA['unique_viewers'])->toBe(2)
        ->and($summaryA['unique_authenticated_viewers'])->toBe(1)
        ->and($summaryA['unique_guest_viewers'])->toBe(1)
        ->and($summaryA['countries'])->toMatchArray([
            'CA' => 1,
            'US' => 1,
        ]);

    expect($summaryB)
        ->toBeArray()
        ->and($summaryB['views'])->toBe(1)
        ->and($summaryB['unique_viewers'])->toBe(1)
        ->and($summaryB['unique_authenticated_viewers'])->toBe(0)
        ->and($summaryB['unique_guest_viewers'])->toBe(1)
        ->and($summaryB['countries'])->toBe([]);
});

<?php

use App\Enums\PostAudience;
use App\Jobs\RecordPostView;
use App\Models\Post;
use App\Models\PostViewEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

it('records a post view once per dedupe window', function (): void {
    config(['cache.default' => 'array']);

    Carbon::setTestNow('2025-01-01 12:00:00');

    $post = Post::factory()
        ->audience(PostAudience::Public)
        ->create();

    $job = new RecordPostView(
        postId: $post->getKey(),
        viewerId: null,
        sessionUuid: 'session-123',
        fingerprintHash: 'fingerprint-hash',
        ipHash: 'ip-hash',
        userAgentHash: 'ua-hash',
        countryCode: 'US',
        context: ['source' => 'feed'],
        occurredAt: Carbon::now(),
        dedupeTtlSeconds: 120,
    );

    $job->handle();

    $post->refresh();

    expect($post->views_count)->toBe(1);
    expect(PostViewEvent::query()->count())->toBe(1);
    expect(PostViewEvent::query()->first()->country_code)->toBe('US');

    $job->handle();
    $post->refresh();

    expect($post->views_count)->toBe(1);
    expect(PostViewEvent::query()->count())->toBe(1);
});


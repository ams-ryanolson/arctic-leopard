<?php

use App\Enums\PostAudience;
use App\Jobs\RecordPostView;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

it('queues a record post view job for a visible post', function (): void {
    Bus::fake();

    config([
        'services.geoip.driver' => 'array',
        'services.geoip.mapping' => [
            '127.0.0.1' => 'US',
        ],
        'services.geoip.fallback_country_code' => 'US',
    ]);

    $post = Post::factory()
        ->audience(PostAudience::Public)
        ->create();

    $user = User::factory()->create([
        'location_country' => 'US',
    ]);

    $this->actingAs($user, 'sanctum');

    $sessionUuid = (string) Str::uuid();

    $response = $this->postJson(route('api.posts.views.store', $post), [
        'session_uuid' => $sessionUuid,
        'context' => [
            'source' => 'feed',
            'location' => 'timeline',
        ],
    ]);

    $response
        ->assertOk()
        ->assertJson([
            'status' => 'queued',
        ]);

    Bus::assertDispatched(RecordPostView::class, function (RecordPostView $job) use ($post, $user, $sessionUuid): bool {
        expect($job->postId)->toBe($post->getKey())
            ->and($job->viewerId)->toBe($user->getKey())
            ->and($job->sessionUuid)->toBe($sessionUuid)
            ->and($job->countryCode)->toBe('US')
            ->and($job->context)->toMatchArray([
                'source' => 'feed',
                'location' => 'timeline',
            ]);

        return true;
    });
});

it('falls back to the viewer profile location when geoip data is unavailable', function (): void {
    Bus::fake();

    config([
        'services.geoip.driver' => null,
    ]);

    $post = Post::factory()
        ->audience(PostAudience::Public)
        ->create();

    $user = User::factory()->create([
        'location_country' => 'Canada',
    ]);

    $this->actingAs($user, 'sanctum');

    $response = $this->postJson(route('api.posts.views.store', $post));

    $response
        ->assertOk()
        ->assertJson([
            'status' => 'queued',
        ]);

    Bus::assertDispatched(RecordPostView::class, function (RecordPostView $job) use ($user): bool {
        expect($job->countryCode)->toBe('CA')
            ->and($job->viewerId)->toBe($user->getKey());

        return true;
    });
});

it('prevents recording a view for a post the viewer cannot access', function (): void {
    Bus::fake();

    $post = Post::factory()
        ->audience(PostAudience::Subscribers)
        ->create();

    $response = $this->postJson(route('api.posts.views.store', $post));

    $response->assertForbidden();

    Bus::assertNothingDispatched();
});

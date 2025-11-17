<?php

use App\Enums\PostAudience;
use App\Enums\PostType;
use App\Events\UserFollowAccepted;
use App\Jobs\RebuildTimelineJob;
use App\Listeners\RefreshFollowerTimeline;
use App\Models\Circle;
use App\Models\Post;
use App\Models\User;
use App\Services\Circles\CircleMembershipService;
use App\Services\Posts\PostCreationService;
use App\Services\UserFollowService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('returns a user feed for a profile', function (): void {
    $author = User::factory()->create();
    $viewer = User::factory()->create();

    Post::factory()
        ->for($author, 'author')
        ->create([
            'audience' => PostAudience::Public->value,
        ]);

    $response = $this->getJson("/api/feed/users/{$author->getKey()}");

    $response->assertOk()
        ->assertJson(fn ($json) => $json->has('data')->etc());

    $posts = $response->json('data');

    expect($posts)->toBeArray()->not->toBeEmpty();

    $firstPost = $posts[0];

    expect($firstPost)
        ->toBeArray()
        ->and($firstPost['likes_count'])->toBe(0)
        ->and($firstPost['comments_count'])->toBe(0)
        ->and($firstPost['reposts_count'])->toBe(0)
        ->and($firstPost['views_count'])->toBe(0)
        ->and($firstPost['has_liked'])->toBeFalse();
});

it('returns following feed entries for an authenticated user', function (): void {
    $viewer = User::factory()->create();

    Sanctum::actingAs($viewer);

    $service = app(PostCreationService::class);

    $service->create(
        $viewer,
        [
            'type' => PostType::Text->value,
            'audience' => PostAudience::Public->value,
            'body' => 'Timeline smoke check',
        ],
        media: [],
        pollData: null,
        hashtags: [],
    );

    $response = $this->getJson('/api/feed/following');

    $response->assertOk()
        ->assertJson(fn ($json) => $json->has('data')->etc());

    $entries = $response->json('data');

    expect($entries)->toBeArray()->not->toBeEmpty()
        ->and($entries[0])->toHaveKeys(['id', 'visible_at', 'created_at']);
});

it('includes the viewers own posts in the following feed', function (): void {
    $viewer = User::factory()->create();

    Sanctum::actingAs($viewer);

    /** @var PostCreationService $service */
    $service = app(PostCreationService::class);

    $service->create(
        $viewer,
        [
            'type' => PostType::Text->value,
            'audience' => PostAudience::Public->value,
            'body' => 'My first scene drop',
        ],
        media: [],
        pollData: null,
        hashtags: [],
    );

    $response = $this->getJson('/api/feed/following');

    $response->assertOk();

    $entries = $response->json('data');

    expect($entries)
        ->toBeArray()
        ->not->toBeEmpty();

    $firstEntry = $entries[0];

    expect($firstEntry['post']['author']['id'])->toBe($viewer->getKey());
});

it('backfills followed posts onto the follower timeline after acceptance', function (): void {
    $follower = User::factory()->create();
    $followed = User::factory()->create();

    Sanctum::actingAs($follower);

    /** @var PostCreationService $service */
    $service = app(PostCreationService::class);

    $service->create(
        $followed,
        [
            'type' => PostType::Text->value,
            'audience' => PostAudience::Followers->value,
            'body' => 'Crew-only drop',
        ],
        media: [],
        pollData: null,
        hashtags: [],
    );

    // Initial request seeds the cache with an empty payload for the follower.
    $initialResponse = $this->getJson('/api/feed/following');
    $initialResponse->assertOk();
    expect($initialResponse->json('data'))->toBeArray()->toBeEmpty();

    /** @var RefreshFollowerTimeline $listener */
    $listener = app(RefreshFollowerTimeline::class);

    /** @var UserFollowService $followService */
    $followService = app(UserFollowService::class);
    $followService->follow($follower, $followed);

    Bus::fake();

    $listener->handle(new UserFollowAccepted($follower, $followed, true));

    Bus::assertDispatched(RebuildTimelineJob::class, function ($dispatch) use ($follower) {
        $jobInstance = $dispatch instanceof RebuildTimelineJob
            ? $dispatch
            : ($dispatch->job ?? null);

        $this->assertInstanceOf(RebuildTimelineJob::class, $jobInstance);
        $this->assertSame($follower->getKey(), $jobInstance->userId);

        $jobInstance->handle();

        return true;
    });

    $response = $this->getJson('/api/feed/following');
    $response->assertOk();

    $entries = $response->json('data');

    expect($entries)
        ->toBeArray()
        ->not->toBeEmpty();

    $firstEntry = $entries[0];

    expect($firstEntry['post']['author']['id'])->toBe($followed->getKey());
});

it('invalidates circle feed cache when posts are added to the circle', function (): void {
    $circle = Circle::factory()->create();
    $author = User::factory()->create();
    $viewer = User::factory()->create();

    /** @var CircleMembershipService $membershipService */
    $membershipService = app(CircleMembershipService::class);

    $membershipService->join($circle, $author);
    $membershipService->join($circle, $viewer);

    Sanctum::actingAs($viewer);

    $firstResponse = $this->getJson("/api/feed/circles/{$circle->slug}");
    $firstResponse->assertOk();
    expect($firstResponse->json('data'))->toBeArray()->toBeEmpty();

    /** @var PostCreationService $postCreation */
    $postCreation = app(PostCreationService::class);

    $postCreation->create(
        $author,
        [
            'type' => PostType::Text->value,
            'audience' => PostAudience::Public->value,
            'body' => 'Circle drop',
            'post_to_circles' => true,
        ],
        media: [],
        pollData: null,
        hashtags: [],
    );

    $response = $this->getJson("/api/feed/circles/{$circle->slug}");
    $response->assertOk();

    $posts = $response->json('data');

    expect($posts)
        ->toBeArray()
        ->not->toBeEmpty();

    $firstPost = $posts[0];

    expect($firstPost['author']['id'])->toBe($author->getKey());
});

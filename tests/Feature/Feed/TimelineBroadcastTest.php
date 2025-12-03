<?php

use App\Enums\PostAudience;
use App\Events\TimelineEntryBroadcast;
use App\Jobs\RebuildTimelineJob;
use App\Jobs\TimelineFanOutJob;
use App\Models\Post;
use App\Models\User;
use App\Services\UserFollowService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

it('broadcasts a timeline entry when fan out runs', function (): void {
    Event::fake([TimelineEntryBroadcast::class]);

    $author = User::factory()->create();
    $follower = User::factory()->create();

    /** @var UserFollowService $followService */
    $followService = app(UserFollowService::class);
    $followService->follow($follower, $author);
    $followService->accept($author, $follower);

    $post = Post::factory()
        ->for($author, 'author')
        ->create([
            'audience' => PostAudience::Public->value,
            'published_at' => now(),
        ]);

    (new TimelineFanOutJob($post->getKey()))->handle();

    Event::assertDispatched(TimelineEntryBroadcast::class, function (TimelineEntryBroadcast $event) use ($follower, $post): bool {
        return $event->userId === $follower->getKey()
            && $event->post->getKey() === $post->getKey();
    });
});

it('does not broadcast timeline entries when a rebuild occurs (rebuilds are background backfills)', function (): void {
    Event::fake([TimelineEntryBroadcast::class]);

    $author = User::factory()->create();
    $follower = User::factory()->create();

    /** @var UserFollowService $followService */
    $followService = app(UserFollowService::class);
    $followService->follow($follower, $author);
    $followService->accept($author, $follower);

    $post = Post::factory()
        ->for($author, 'author')
        ->create([
            'audience' => PostAudience::Followers->value,
            'published_at' => now(),
        ]);

    (new RebuildTimelineJob($follower->getKey()))->handle();

    // Rebuilds should NOT broadcast - they're background operations for backfilling old posts
    // Only TimelineFanOutJob should broadcast for new posts
    Event::assertNotDispatched(TimelineEntryBroadcast::class);

    // But the timeline entry SHOULD be created
    $this->assertDatabaseHas('timelines', [
        'user_id' => $follower->getKey(),
        'post_id' => $post->getKey(),
    ]);
});

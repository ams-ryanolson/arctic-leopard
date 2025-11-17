<?php

use App\Enums\StoryAudience;
use App\Models\AdminSetting;
use App\Models\Story;
use App\Models\User;
use App\Services\Stories\StoryService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

beforeEach(function (): void {
    AdminSetting::set('feature_stories_enabled', true);
    Storage::fake('public');
});

test('story service returns empty array when feature is disabled', function (): void {
    AdminSetting::set('feature_stories_enabled', false);

    $service = app(StoryService::class);
    $stories = $service->getStoriesForDashboard(null);

    expect($stories)->toBe([]);
});

test('story service can create a story', function (): void {
    Storage::disk('public')->put('stories/test.jpg', 'fake content');

    $user = User::factory()->create([
        'profile_completed_at' => now(),
    ]);

    $service = app(StoryService::class);

    $story = $service->createStory($user, [
        'media' => [
            [
                'disk' => 'public',
                'path' => 'stories/test.jpg',
                'mime_type' => 'image/jpeg',
                'width' => 800,
                'height' => 1200,
                'size' => 500000,
            ],
        ],
        'audience' => StoryAudience::Public->value,
        'is_subscriber_only' => false,
    ]);

    expect($story)->toBeInstanceOf(Story::class);
    expect($story->user_id)->toBe($user->getKey());
    expect($story->media)->not->toBeNull();
    expect($story->published_at)->not->toBeNull();
    expect($story->expires_at)->not->toBeNull();
});

test('story service can check if story can be viewed', function (): void {
    $author = User::factory()->create();
    $viewer = User::factory()->create();

    $story = Story::factory()
        ->for($author)
        ->published()
        ->create([
            'audience' => StoryAudience::Public->value,
            'published_at' => Carbon::now()->subHour(),
            'expires_at' => Carbon::now()->addHours(23),
        ]);

    $story->load('user');

    $service = app(StoryService::class);

    expect($service->canViewStory($story, $viewer))->toBeTrue();
    expect($service->canViewStory($story, null))->toBeTrue();
    expect($service->canViewStory($story, $author))->toBeTrue();
});

test('story service respects audience restrictions', function (): void {
    $author = User::factory()->create();
    $viewer = User::factory()->create();

    $story = Story::factory()
        ->for($author)
        ->published()
        ->create([
            'audience' => StoryAudience::Followers->value,
        ]);

    $service = app(StoryService::class);

    // Viewer doesn't follow author, so cannot view
    expect($service->canViewStory($story, $viewer))->toBeFalse();

    // Author can always view their own story
    expect($service->canViewStory($story, $author))->toBeTrue();
});

test('story service marks story as viewed', function (): void {
    $author = User::factory()->create();
    $viewer = User::factory()->create();

    $story = Story::factory()
        ->for($author)
        ->published()
        ->create([
            'audience' => StoryAudience::Public->value,
        ]);

    $service = app(StoryService::class);

    $service->markAsViewed($story, $viewer);

    expect($story->views()->where('user_id', $viewer->getKey())->exists())->toBeTrue();
    expect($story->fresh()->views_count)->toBe(1);
});

test('story service soft deletes stories', function (): void {
    $story = Story::factory()->published()->create();

    $service = app(StoryService::class);

    $service->deleteStory($story);

    expect(Story::query()->find($story->getKey()))->toBeNull();
    expect(Story::withTrashed()->find($story->getKey()))->not->toBeNull();
});

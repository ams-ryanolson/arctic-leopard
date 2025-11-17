<?php

use App\Enums\StoryAudience;
use App\Models\AdminSetting;
use App\Models\Story;
use App\Models\StoryMedia;
use App\Models\StoryReaction;
use App\Models\StoryView;
use App\Models\User;

beforeEach(function (): void {
    // Enable stories feature for tests
    AdminSetting::set('feature_stories_enabled', true);
});

test('authenticated users can view stories list', function (): void {
    $user = User::factory()->create([
        'profile_completed_at' => now(),
    ]);

    $otherUser = User::factory()->create();
    Story::factory()
        ->for($otherUser)
        ->published()
        ->has(StoryMedia::factory(), 'media')
        ->create();

    $this->actingAs($user);

    $response = $this->getJson(route('stories.index'));

    $response->assertSuccessful();
    $response->assertJsonStructure([
        'data' => [
            '*' => [
                'id',
                'username',
                'display_name',
                'avatar_url',
                'latest_story_preview',
                'story_count',
                'has_new_stories',
            ],
        ],
    ]);
});

test('stories feature must be enabled to view stories', function (): void {
    AdminSetting::set('feature_stories_enabled', false);

    $user = User::factory()->create([
        'profile_completed_at' => now(),
    ]);

    $this->actingAs($user);

    $response = $this->get(route('stories.index'));

    $response->assertRedirect(route('dashboard'));
});

test('authenticated users with completed profile can create stories', function (): void {
    \Illuminate\Support\Facades\Storage::fake('local');

    $user = User::factory()->create([
        'profile_completed_at' => now(),
    ]);

    $this->actingAs($user);

    // Step 1: Upload to temporary storage
    $file = \Illuminate\Http\UploadedFile::fake()->image('test.jpg', 800, 1200);
    $uploadResponse = $this->postJson('/uploads/tmp', [
        'file' => $file,
    ])->assertSuccessful();

    $identifier = $uploadResponse->json('id') ?? $uploadResponse->json('identifier');

    // Step 2: Create story with identifier
    $response = $this->postJson(route('stories.store'), [
        'media' => [
            [
                'identifier' => $identifier,
                'mime_type' => 'image/jpeg',
                'width' => 800,
                'height' => 1200,
                'size' => 500000,
            ],
        ],
        'audience' => StoryAudience::Public->value,
        'is_subscriber_only' => false,
    ]);

    $response->assertCreated();
    $response->assertJsonStructure([
        'data' => [
            'id',
            'user_id',
            'audience',
            'is_subscriber_only',
            'published_at',
            'expires_at',
            'author',
            'media',
        ],
    ]);

    expect(Story::query()->count())->toBe(1);
    expect(StoryMedia::query()->count())->toBe(1);
});

test('users without completed profile cannot create stories', function (): void {
    Storage::fake('public');
    Storage::disk('public')->put('stories/test.jpg', 'fake content');

    $user = User::factory()->create([
        'profile_completed_at' => null,
    ]);

    $this->actingAs($user);

    $response = $this->post(route('stories.store'), [
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
    ]);

    // Authorization should prevent story creation - either 403 or redirect
    expect($response->status())->toBeIn([403, 302]);
    expect(Story::query()->count())->toBe(0);
});

test('users can view a story they have permission to see', function (): void {
    $author = User::factory()->create();
    $viewer = User::factory()->create();

    $story = Story::factory()
        ->for($author)
        ->published()
        ->has(StoryMedia::factory(), 'media')
        ->create([
            'audience' => StoryAudience::Public->value,
            'published_at' => now()->subHour(),
            'expires_at' => now()->addHours(23),
            'is_subscriber_only' => false,
        ]);

    // Refresh to ensure dates are saved
    $story->refresh();

    $this->actingAs($viewer);

    $response = $this->getJson(route('stories.show', $story));

    $response->assertSuccessful();
    $response->assertJsonStructure([
        'data' => [
            'id',
            'author',
            'media',
            'has_viewed',
        ],
    ]);

    // Story should be marked as viewed
    expect(StoryView::query()->where('story_id', $story->getKey())->where('user_id', $viewer->getKey())->exists())->toBeTrue();
});

test('users cannot view stories they do not have permission to see', function (): void {
    $author = User::factory()->create();
    $viewer = User::factory()->create();

    $story = Story::factory()
        ->for($author)
        ->published()
        ->has(StoryMedia::factory(), 'media')
        ->create([
            'audience' => StoryAudience::Subscribers->value,
        ]);

    $this->actingAs($viewer);

    $response = $this->getJson(route('stories.show', $story));

    $response->assertForbidden();
});

test('story authors can delete their own stories', function (): void {
    $user = User::factory()->create([
        'profile_completed_at' => now(),
    ]);

    $story = Story::factory()
        ->for($user)
        ->published()
        ->has(StoryMedia::factory(), 'media')
        ->create();

    $this->actingAs($user);

    $response = $this->deleteJson(route('stories.destroy', $story));

    $response->assertNoContent();

    expect(Story::query()->find($story->getKey()))->toBeNull();
});

test('users cannot delete stories they did not create', function (): void {
    $author = User::factory()->create();
    $viewer = User::factory()->create();

    $story = Story::factory()
        ->for($author)
        ->published()
        ->has(StoryMedia::factory(), 'media')
        ->create();

    $this->actingAs($viewer);

    $response = $this->deleteJson(route('stories.destroy', $story));

    $response->assertForbidden();
});

test('users can mark stories as viewed', function (): void {
    $author = User::factory()->create();
    $viewer = User::factory()->create();

    $story = Story::factory()
        ->for($author)
        ->published()
        ->has(StoryMedia::factory(), 'media')
        ->create([
            'audience' => StoryAudience::Public->value,
        ]);

    $this->actingAs($viewer);

    $response = $this->postJson(route('stories.view', $story));

    $response->assertSuccessful();

    expect(StoryView::query()->where('story_id', $story->getKey())->where('user_id', $viewer->getKey())->exists())->toBeTrue();
    expect($story->fresh()->views_count)->toBe(1);
});

test('story authors can view analytics for their stories', function (): void {
    $user = User::factory()->create([
        'profile_completed_at' => now(),
    ]);

    $story = Story::factory()
        ->for($user)
        ->published()
        ->has(StoryMedia::factory(), 'media')
        ->create();

    $this->actingAs($user);

    $response = $this->getJson(route('stories.analytics', $story));

    $response->assertSuccessful();
    $response->assertJsonStructure([
        'views_count',
        'reactions_count',
        'reactions',
        'published_at',
        'expires_at',
        'is_expired',
    ]);
});

test('users cannot view analytics for stories they did not create', function (): void {
    $author = User::factory()->create();
    $viewer = User::factory()->create();

    $story = Story::factory()
        ->for($author)
        ->published()
        ->has(StoryMedia::factory(), 'media')
        ->create();

    $this->actingAs($viewer);

    $response = $this->getJson(route('stories.analytics', $story));

    $response->assertForbidden();
});

test('users can react to stories', function (): void {
    $author = User::factory()->create();
    $viewer = User::factory()->create();

    $story = Story::factory()
        ->for($author)
        ->published()
        ->has(StoryMedia::factory(), 'media')
        ->create([
            'audience' => StoryAudience::Public->value,
            'published_at' => now()->subHour(),
            'expires_at' => now()->addHours(23),
            'is_subscriber_only' => false,
        ]);

    // Refresh to ensure dates are saved
    $story->refresh();

    $this->actingAs($viewer);

    $response = $this->postJson(route('stories.reactions.store', $story), [
        'emoji' => '❤️',
    ]);

    $response->assertSuccessful();
    $response->assertJsonStructure([
        'reactions',
        'reactions_count',
    ]);

    expect(StoryReaction::query()->where('story_id', $story->getKey())->where('user_id', $viewer->getKey())->where('emoji', '❤️')->exists())->toBeTrue();
    expect($story->fresh()->reactions_count)->toBe(1);
});

test('users can toggle reactions on stories', function (): void {
    $author = User::factory()->create();
    $viewer = User::factory()->create();

    $story = Story::factory()
        ->for($author)
        ->published()
        ->has(StoryMedia::factory(), 'media')
        ->create([
            'audience' => StoryAudience::Public->value,
        ]);

    $this->actingAs($viewer);

    // Add reaction
    $this->postJson(route('stories.reactions.store', $story), [
        'emoji' => '❤️',
    ]);

    expect(StoryReaction::query()->where('story_id', $story->getKey())->where('user_id', $viewer->getKey())->where('emoji', '❤️')->exists())->toBeTrue();
    expect($story->fresh()->reactions_count)->toBe(1);

    // Remove reaction (toggle)
    $this->postJson(route('stories.reactions.store', $story), [
        'emoji' => '❤️',
    ]);

    expect(StoryReaction::query()->where('story_id', $story->getKey())->where('user_id', $viewer->getKey())->where('emoji', '❤️')->exists())->toBeFalse();
    expect($story->fresh()->reactions_count)->toBe(0);
});

<?php

use App\Models\Story;
use App\Models\StoryMedia;
use App\Models\StoryReaction;
use App\Models\StoryView;
use App\Models\User;
use Illuminate\Support\Carbon;

test('story can determine if it is expired', function (): void {
    $story = Story::factory()->make([
        'published_at' => Carbon::now()->subHours(25),
        'expires_at' => Carbon::now()->subHour(),
    ]);

    expect($story->isExpired())->toBeTrue();

    $story = Story::factory()->make([
        'published_at' => Carbon::now()->subHour(),
        'expires_at' => Carbon::now()->addHours(23),
    ]);

    expect($story->isExpired())->toBeFalse();
});

test('story scope published filters correctly', function (): void {
    Story::factory()->published()->create();
    Story::factory()->make([
        'published_at' => null,
    ])->save();
    Story::factory()->make([
        'published_at' => Carbon::now()->addHour(),
    ])->save();

    expect(Story::query()->published()->count())->toBe(1);
});

test('story scope notExpired filters correctly', function (): void {
    Story::factory()->published()->create();
    Story::factory()->expired()->create();
    Story::factory()->make([
        'expires_at' => null,
    ])->save();

    expect(Story::query()->notExpired()->count())->toBe(2);
});

test('story scope active filters published and not expired stories', function (): void {
    Story::factory()->published()->create();
    Story::factory()->expired()->create();
    Story::factory()->make([
        'published_at' => null,
    ])->save();

    expect(Story::query()->active()->count())->toBe(1);
});

test('story can mark as viewed by user', function (): void {
    $user = User::factory()->create();
    $story = Story::factory()->published()->create();

    $story->markAsViewedBy($user);

    expect(StoryView::query()->where('story_id', $story->getKey())->where('user_id', $user->getKey())->exists())->toBeTrue();
    expect($story->fresh()->views_count)->toBe(1);
});

test('story does not create duplicate views', function (): void {
    $user = User::factory()->create();
    $story = Story::factory()->published()->create();

    $story->markAsViewedBy($user);
    $story->markAsViewedBy($user);

    expect(StoryView::query()->where('story_id', $story->getKey())->where('user_id', $user->getKey())->count())->toBe(1);
    expect($story->fresh()->views_count)->toBe(1);
});

test('story can increment and decrement reaction counts', function (): void {
    $story = Story::factory()->published()->create([
        'reactions_count' => 0,
    ]);

    $story->incrementReactionsCount();
    expect($story->fresh()->reactions_count)->toBe(1);

    $story->incrementReactionsCount();
    expect($story->fresh()->reactions_count)->toBe(2);

    $story->decrementReactionsCount();
    expect($story->fresh()->reactions_count)->toBe(1);

    $story->decrementReactionsCount();
    expect($story->fresh()->reactions_count)->toBe(0);

    // Should not go below 0
    $story->decrementReactionsCount();
    expect($story->fresh()->reactions_count)->toBe(0);
});

test('story has relationships', function (): void {
    $user = User::factory()->create();
    $story = Story::factory()->for($user)->published()->create();
    StoryMedia::factory()->for($story)->create();
    StoryView::factory()->for($story)->for($user)->create();
    StoryReaction::factory()->for($story)->for($user)->create();

    expect($story->user)->toBeInstanceOf(User::class);
    expect($story->media)->toBeInstanceOf(StoryMedia::class);
    expect($story->views)->toHaveCount(1);
    expect($story->reactions)->toHaveCount(1);
});

test('story calculates expires_at when published_at is set', function (): void {
    $story = Story::factory()->make([
        'published_at' => null,
        'expires_at' => null,
    ]);

    $publishedAt = Carbon::now();
    $story->published_at = $publishedAt;
    $story->save();

    $freshStory = $story->fresh();
    expect($freshStory->expires_at)->not->toBeNull();
    // The expires_at should be 24 hours after published_at (allow small timing differences)
    $hoursDiff = abs($freshStory->expires_at->diffInHours($freshStory->published_at));
    expect($hoursDiff)->toBeGreaterThanOrEqual(23)->and($hoursDiff)->toBeLessThanOrEqual(25);
});

<?php

use App\Models\Bookmark;
use App\Models\Post;
use App\Models\User;
use App\Models\UserBlock;
use App\Services\UserBlockService;
use Illuminate\Support\Facades\DB;

it('creates a block and prunes existing interactions', function (): void {
    /** @var UserBlockService $service */
    $service = app(UserBlockService::class);

    $blocker = User::factory()->create();
    $blocked = User::factory()->create();

    $blockedPost = Post::factory()->for($blocked, 'author')->create();
    $blockerPost = Post::factory()->for($blocker, 'author')->create();

    $blocker->follow($blocked);
    $blocked->follow($blocker);

    Bookmark::query()->create([
        'user_id' => $blocker->getKey(),
        'post_id' => $blockedPost->getKey(),
    ]);

    Bookmark::query()->create([
        'user_id' => $blocked->getKey(),
        'post_id' => $blockerPost->getKey(),
    ]);

    $blocker->like($blockedPost);
    $blocked->like($blockerPost);

    $block = $service->block($blocker, $blocked);

    expect($block)->toBeInstanceOf(UserBlock::class)
        ->and(UserBlock::query()->count())->toBe(1)
        ->and($blocker->fresh()->isFollowing($blocked))->toBeFalse()
        ->and($blocked->fresh()->isFollowing($blocker))->toBeFalse()
        ->and(Bookmark::query()->where('user_id', $blocker->getKey())->exists())->toBeFalse()
        ->and(Bookmark::query()->where('user_id', $blocked->getKey())->exists())->toBeFalse()
        ->and(
            DB::table(config('like.likes_table'))
                ->where(config('like.user_foreign_key'), $blocker->getKey())
                ->exists(),
        )->toBeFalse()
        ->and(
            DB::table(config('like.likes_table'))
                ->where(config('like.user_foreign_key'), $blocked->getKey())
                ->exists(),
        )->toBeFalse();

    $duplicate = $service->block($blocker, $blocked);

    expect($duplicate->getKey())->toBe($block->getKey());
});

it('unblocks a user by removing the persisted record', function (): void {
    /** @var UserBlockService $service */
    $service = app(UserBlockService::class);

    $blocker = User::factory()->create();
    $blocked = User::factory()->create();

    $service->block($blocker, $blocked);

    expect(UserBlock::query()->where('blocker_id', $blocker->getKey())->where('blocked_id', $blocked->getKey())->exists())
        ->toBeTrue();

    $service->unblock($blocker, $blocked);

    expect(UserBlock::query()->where('blocker_id', $blocker->getKey())->where('blocked_id', $blocked->getKey())->exists())
        ->toBeFalse();
});





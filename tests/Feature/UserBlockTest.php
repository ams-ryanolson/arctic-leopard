<?php

use App\Models\Bookmark;
use App\Models\Post;
use App\Models\User;
use App\Models\UserBlock;
use App\Notifications\UserFollowedNotification;
use App\Services\UserBlockService;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

use function Pest\Laravel\actingAs;

it('blocks a user via the http endpoint and prunes interactions', function (): void {
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

    $blocked->notify(new UserFollowedNotification($blocker));

    actingAs($blocker)
        ->from(route('profile.show', $blocked->username))
        ->post(route('users.block.store', $blocked), [
            'reason' => 'Screening content',
        ])
        ->assertRedirect();

    expect(UserBlock::query()->where('blocker_id', $blocker->getKey())->where('blocked_id', $blocked->getKey())->exists())
        ->toBeTrue()
        ->and($blocker->fresh()->isFollowing($blocked))->toBeFalse()
        ->and($blocked->fresh()->isFollowing($blocker))->toBeFalse()
        ->and(
            DB::table(config('like.likes_table'))
                ->where(config('like.user_foreign_key'), $blocker->getKey())
                ->exists(),
        )->toBeFalse()
        ->and(
            DB::table(config('like.likes_table'))
                ->where(config('like.user_foreign_key'), $blocked->getKey())
                ->exists(),
        )->toBeFalse()
        ->and(
            Bookmark::query()
                ->where('user_id', $blocker->getKey())
                ->exists(),
        )->toBeFalse()
        ->and(
            Bookmark::query()
                ->where('user_id', $blocked->getKey())
                ->exists(),
        )->toBeFalse();

    $notifications = $blocked->fresh()->notifications;

    expect($notifications)->toHaveCount(0);
});

it('unblocks a user via the http endpoint', function (): void {
    /** @var UserBlockService $service */
    $service = app(UserBlockService::class);

    $blocker = User::factory()->create();
    $blocked = User::factory()->create();

    $service->block($blocker, $blocked);

    actingAs($blocker)
        ->from('/settings/blocked-users')
        ->delete(route('users.block.destroy', $blocked))
        ->assertRedirect();

    expect(UserBlock::query()->where('blocker_id', $blocker->getKey())->where('blocked_id', $blocked->getKey())->exists())
        ->toBeFalse();
});

it('renders the blocked profile fallback when a block exists', function (): void {
    $service = app(UserBlockService::class);

    $blocker = User::factory()->create(['username' => 'blocker']);
    $blocked = User::factory()->create(['username' => 'subject']);

    $service->block($blocker, $blocked);

    actingAs($blocker)
        ->get(route('profile.show', $blocked->username))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Profile/Blocked')
            ->where('user.id', $blocked->getKey())
            ->where('blocked.viewer_has_blocked', true)
            ->where('blocked.profile_has_blocked_viewer', false),
        );
});

it('lists blocked users on the settings page', function (): void {
    $service = app(UserBlockService::class);

    $user = User::factory()->create();
    $blocked = User::factory()->create([
        'username' => 'blocked-member',
        'display_name' => 'Blocked Member',
    ]);

    $service->block($user, $blocked);

    actingAs($user)
        ->get(route('settings.privacy.blocked-users'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('settings/blocked-users')
            ->has('blocked', fn (AssertableInertia $blockedList) => $blockedList
                ->has(0, fn (AssertableInertia $entry) => $entry
                    ->where('id', $blocked->getKey())
                    ->where('username', $blocked->username)
                    ->where('display_name', $blocked->display_name)
                    ->etc(),
                ),
            ),
        );
});

<?php

use App\Models\User;
use App\Notifications\UserFollowRequestApprovedNotification;
use App\Notifications\UserFollowRequestedNotification;
use App\Notifications\UserFollowedNotification;
use App\Services\Toasts\ToastBus;
use Illuminate\Support\Facades\Cache;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\withoutMiddleware;

it('creates a pending follow request when approvals are required', function (): void {
    Cache::store()->clear();

    $follower = User::factory()->create();
    $creator = User::factory()->create([
        'requires_follow_approval' => true,
    ]);

    actingAs($follower, 'web')
        ->postJson(route('users.follow.store', $creator))
        ->assertOk()
        ->assertJson([
            'status' => 'pending',
            'pending' => true,
            'accepted' => false,
        ]);

    /** @var \Overtrue\LaravelFollow\Followable|null $pivot */
    $pivot = $follower->followings()->of($creator)->first();

    expect($pivot)->not->toBeNull()
        ->and($pivot->accepted_at)->toBeNull();

    $creator->refresh();

    expect($creator->notifications()->where('type', UserFollowRequestedNotification::TYPE)->count())->toBe(1)
        ->and($creator->notifications()->where('type', UserFollowedNotification::TYPE)->count())->toBe(0);

    $toasts = app(ToastBus::class)->peek($creator);
    $followerLabel = $follower->display_name ?? ($follower->username ? '@'.$follower->username : ($follower->name ?? 'Someone'));
    $followRequestToast = collect($toasts)->first(fn ($toast) => ($toast['body'] ?? null) === sprintf('%s requested to follow you.', $followerLabel));

    expect($followRequestToast)->not->toBeNull();
});

it('immediately accepts a follow when approvals are not required', function (): void {
    Cache::store()->clear();

    $follower = User::factory()->create();
    $creator = User::factory()->create([
        'requires_follow_approval' => false,
    ]);

    actingAs($follower, 'web')
        ->postJson(route('users.follow.store', $creator))
        ->assertOk()
        ->assertJson([
            'status' => 'following',
            'pending' => false,
            'accepted' => true,
        ]);

    /** @var \Overtrue\LaravelFollow\Followable|null $pivot */
    $pivot = $follower->followings()->of($creator)->first();

    expect($pivot)->not->toBeNull()
        ->and($pivot->accepted_at)->not->toBeNull();

    $creator->refresh();

    expect($creator->notifications()->where('type', UserFollowedNotification::TYPE)->count())->toBe(1)
        ->and($creator->notifications()->where('type', UserFollowRequestedNotification::TYPE)->count())->toBe(0);

    $toasts = app(ToastBus::class)->peek($creator);
    $followerLabel = $follower->display_name ?? ($follower->username ? '@'.$follower->username : ($follower->name ?? 'Someone'));
    $followerToast = collect($toasts)->first(fn ($toast) => ($toast['body'] ?? null) === sprintf('%s is now following you.', $followerLabel));

    expect($followerToast)->not->toBeNull();
});

it('approves a follow request via the accept endpoint', function (): void {
    withoutMiddleware([
        \App\Http\Middleware\EnsureProfileIsCompleted::class,
        \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
    ]);
    Cache::store()->clear();

    $follower = User::factory()->create();
    $creator = User::factory()->create([
        'requires_follow_approval' => true,
    ]);

    /** @var \App\Services\UserFollowService $followService */
    $followService = app(\App\Services\UserFollowService::class);
    $followService->follow($follower, $creator);

    $creator->refresh();

    expect($creator->notifications()->where('type', UserFollowRequestedNotification::TYPE)->count())->toBe(1);

    $requestToasts = app(ToastBus::class)->peek($creator);
    $followerLabel = $follower->display_name ?? ($follower->username ? '@'.$follower->username : ($follower->name ?? 'Someone'));
    $initialRequestToast = collect($requestToasts)->first(fn ($toast) => ($toast['body'] ?? null) === sprintf('%s requested to follow you.', $followerLabel));
    expect($initialRequestToast)->not->toBeNull();

    Cache::store()->clear();

    actingAs($creator, 'web')
        ->postJson(route('users.follow-requests.accept', [
            'user' => $creator,
            'follower' => $follower,
        ]))
        ->assertOk()
        ->assertJson([
            'status' => 'accepted',
            'follower_id' => $follower->getKey(),
        ]);

    expect($follower->fresh()->isFollowing($creator))->toBeTrue()
        ->and($creator->pendingFollowers()->count())->toBe(0);

    $creator->refresh();
    $follower->refresh();

    $mutatedNotification = $creator->notifications()
        ->where('type', UserFollowedNotification::TYPE)
        ->whereJsonContains('data->actor->id', $follower->getKey())
        ->first();

    expect($mutatedNotification)->not->toBeNull()
        ->and(data_get($mutatedNotification->data, 'type'))->toBe('user-followed');

    expect($creator->notifications()->where('type', UserFollowRequestedNotification::TYPE)->count())->toBe(0);

    $approvalNotification = $follower->notifications()
        ->where('type', UserFollowRequestApprovedNotification::TYPE)
        ->whereJsonContains('data->actor->id', $creator->getKey())
        ->first();

    expect($approvalNotification)->not->toBeNull();

    $followedToasts = app(ToastBus::class)->peek($creator);
    $followedToast = collect($followedToasts)->first(fn ($toast) => ($toast['body'] ?? null) === sprintf('%s is now following you.', $followerLabel));
    expect($followedToast)->not->toBeNull();

    $followerToasts = app(ToastBus::class)->peek($follower);
    $creatorLabel = $creator->display_name ?? ($creator->username ? '@'.$creator->username : ($creator->name ?? (string) $creator->getKey()));
    $approvalToast = collect($followerToasts)->first(fn ($toast) => ($toast['body'] ?? null) === sprintf('%s approved your follow request.', $creatorLabel));
    expect($approvalToast)->not->toBeNull();
});

it('rejects a follow request via the destroy endpoint', function (): void {
    withoutMiddleware([
        \App\Http\Middleware\EnsureProfileIsCompleted::class,
        \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
    ]);
    $follower = User::factory()->create();
    $creator = User::factory()->create([
        'requires_follow_approval' => true,
    ]);

    /** @var \App\Services\UserFollowService $followService */
    $followService = app(\App\Services\UserFollowService::class);
    $followService->follow($follower, $creator);

    expect($creator->pendingFollowers()->count())->toBe(1);

    actingAs($creator, 'web')
        ->deleteJson(route('users.follow-requests.destroy', [
            'user' => $creator,
            'follower' => $follower,
        ]))
        ->assertOk()
        ->assertJson([
            'status' => 'rejected',
            'follower_id' => $follower->getKey(),
        ]);

    expect($creator->pendingFollowers()->count())->toBe(0)
        ->and($follower->followings()->of($creator)->exists())->toBeFalse();
});

it('accepts pending requests when follow approvals are disabled', function (): void {
    withoutMiddleware([
        \App\Http\Middleware\EnsureProfileIsCompleted::class,
        \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
    ]);

    $email = fake()->unique()->safeEmail();

    $creator = User::factory()->create([
        'requires_follow_approval' => true,
        'name' => 'Creator Example',
        'email' => $email,
    ]);

    $followers = User::factory()->count(2)->create();
    /** @var \App\Services\UserFollowService $followService */
    $followService = app(\App\Services\UserFollowService::class);

    foreach ($followers as $follower) {
        $followService->follow($follower, $creator);
    }

    expect($creator->pendingFollowers()->count())->toBe(2);
    expect($creator->notifications()->where('type', UserFollowRequestedNotification::TYPE)->count())->toBe(2);

    actingAs($creator, 'web')
        ->from(route('profile.edit'))
        ->patch(route('profile.update'), [
            'name' => $creator->name,
            'email' => $email,
            'requires_follow_approval' => '0',
        ])
        ->assertRedirect(route('profile.edit'));

    $creator->refresh();

    expect($creator->requires_follow_approval)->toBeFalse();

    foreach ($followers as $follower) {
        expect($follower->fresh()->isFollowing($creator))->toBeTrue();
    }

    $creator->refresh();
    expect($creator->notifications()->where('type', UserFollowRequestedNotification::TYPE)->count())->toBe(0);
    expect($creator->notifications()->where('type', UserFollowedNotification::TYPE)->count())->toBeGreaterThanOrEqual(1);

    foreach ($followers as $follower) {
        expect(
            $follower->notifications()
                ->where('type', UserFollowRequestApprovedNotification::TYPE)
                ->whereJsonContains('data->actor->id', $creator->getKey())
                ->count()
        )->toBe(1);
    }
});

it('removes follow request notifications when the follower withdraws', function (): void {
    $follower = User::factory()->create();
    $creator = User::factory()->create([
        'requires_follow_approval' => true,
    ]);

    actingAs($follower, 'web')
        ->postJson(route('users.follow.store', $creator))
        ->assertOk();

    expect($creator->fresh()->notifications()->where('type', UserFollowRequestedNotification::TYPE)->count())->toBe(1);

    actingAs($follower, 'web')
        ->deleteJson(route('users.follow.destroy', $creator))
        ->assertOk();

    expect($creator->fresh()->notifications()->where('type', UserFollowRequestedNotification::TYPE)->count())->toBe(0);
});



<?php

use App\Enums\PostAudience;
use App\Models\Post;
use App\Models\User;
use App\Notifications\PostBookmarkedNotification;
use App\Notifications\PostLikedNotification;
use App\Notifications\UserFollowedNotification;
use App\Services\Toasts\ToastBus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;
use function Pest\Laravel\actingAs;

uses(RefreshDatabase::class);

it('creates a notification when a post is liked by another user', function (): void {
    Cache::store()->clear();

    $author = User::factory()->create();
    $actor = User::factory()->create();
    $post = Post::factory()->for($author, 'author')->create([
        'audience' => PostAudience::Public->value,
    ]);

    actingAs($actor);

    $this->postJson(route('posts.like.store', $post))->assertOk();

    $notification = $author->notifications()->first();

    expect($notification)->toBeInstanceOf(DatabaseNotification::class);
    expect($notification->data['type'] ?? null)->toBe('post-liked');
    expect($notification->data['actor']['id'] ?? null)->toBe($actor->getKey());
    expect($notification->data['subject']['id'] ?? null)->toBe($post->getKey());

    $toasts = app(ToastBus::class)->peek($author);
    $expectedBody = sprintf('%s liked your post.', $actor->display_name ?? ($actor->username ? '@'.$actor->username : ($actor->name ?? 'Someone')));
    $likeToast = collect($toasts)->first(fn ($toast) => ($toast['body'] ?? null) === $expectedBody);

    expect($likeToast)->not->toBeNull();
    expect($likeToast['actions'][0]['route'] ?? null)->toBe(route('notifications.index', ['filter' => 'unread']));
});

it('deletes a single notification', function (): void {
    $user = User::factory()->create();
    $actor = User::factory()->create();
    $post = Post::factory()->for($user, 'author')->create([
        'audience' => PostAudience::Public->value,
    ]);

    $user->notifyNow(new PostLikedNotification($actor, $post));

    $notification = $user->notifications()->first();

    $this->actingAs($user)
        ->deleteJson(route('notifications.destroy', $notification))
        ->assertOk()
        ->assertJsonPath('id', $notification->getKey())
        ->assertJsonPath('unread_count', 0);

    expect($user->notifications()->count())->toBe(0);
});

it('deletes all notifications', function (): void {
    $user = User::factory()->create();
    $actor = User::factory()->create();
    $post = Post::factory()->for($user, 'author')->create([
        'audience' => PostAudience::Public->value,
    ]);

    $user->notifyNow(new PostLikedNotification($actor, $post));
    $user->notifyNow(new PostBookmarkedNotification($actor, $post));

    expect($user->notifications()->count())->toBe(2);

    $this->actingAs($user)
        ->deleteJson(route('notifications.destroy-all'))
        ->assertOk()
        ->assertJsonPath('unread_count', 0);

    expect($user->notifications()->count())->toBe(0);
});

it('does not notify an author when they like their own post', function (): void {
    $author = User::factory()->create();
    $post = Post::factory()->for($author, 'author')->create([
        'audience' => PostAudience::Public->value,
    ]);

    actingAs($author);

    $this->postJson(route('posts.like.store', $post))->assertOk();

    expect($author->notifications()->count())->toBe(0);
});

it('creates a notification when a post is bookmarked', function (): void {
    $author = User::factory()->create();
    $actor = User::factory()->create();
    $post = Post::factory()->for($author, 'author')->create([
        'audience' => PostAudience::Public->value,
    ]);

    actingAs($actor);

    $this->postJson(route('posts.bookmarks.store', $post))->assertCreated();

    $notification = $author->notifications()->first();

    expect($notification)->toBeInstanceOf(DatabaseNotification::class);
    expect($notification->data['type'] ?? null)->toBe('post-bookmarked');
    expect($notification->data['actor']['id'] ?? null)->toBe($actor->getKey());
});

it('creates a notification when a user gains a follower', function (): void {
    $followed = User::factory()->create();
    $follower = User::factory()->create();

    $follower->follow($followed);

    $notification = $followed->notifications()->first();

    expect($notification)->toBeInstanceOf(DatabaseNotification::class);
    expect($notification->data['type'] ?? null)->toBe('user-followed');
    expect($notification->data['actor']['id'] ?? null)->toBe($follower->getKey());
});

it('renders the notifications index page with expected props', function (): void {
    $user = User::factory()->create();
    $actor = User::factory()->create();
    $post = Post::factory()->for($user, 'author')->create([
        'audience' => PostAudience::Public->value,
    ]);

    Carbon::setTestNow('2025-11-11 00:00:00');
    $user->notifyNow(new PostLikedNotification($actor, $post));
    Carbon::setTestNow();

    $this->actingAs($user)
        ->get(route('notifications.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Notifications/Index')
            ->has('notifications.data', 1, fn (Assert $notification) => $notification
                ->where('type', 'post-liked')
                ->where('actor.username', $actor->username)
                ->etc()
            )
            ->where('unreadCount', 1)
            ->where('notifications.meta.filter', 'all')
        );
});

it('filters notifications by unread status via json response', function (): void {
    $user = User::factory()->create();
    $actor = User::factory()->create();
    $post = Post::factory()->for($user, 'author')->create([
        'audience' => PostAudience::Public->value,
    ]);

    $user->notifyNow(new PostLikedNotification($actor, $post));

    $readNotification = $user->notifications()->first();
    $readNotification->markAsRead();

    $user->notifyNow(new PostBookmarkedNotification($actor, $post));

    $this->actingAs($user)
        ->getJson(route('notifications.index', ['filter' => 'unread']))
        ->assertOk()
        ->assertJsonPath('data.0.type', 'post-bookmarked')
        ->assertJsonMissingPath('data.1');
});

it('returns the unread notification count', function (): void {
    $user = User::factory()->create();
    $actor = User::factory()->create();
    $post = Post::factory()->for($user, 'author')->create([
        'audience' => PostAudience::Public->value,
    ]);

    $user->notifyNow(new PostLikedNotification($actor, $post));

    $this->actingAs($user)
        ->getJson(route('notifications.unread-count'))
        ->assertOk()
        ->assertJsonPath('count', 1);
});

it('marks a single notification as read', function (): void {
    $user = User::factory()->create();
    $actor = User::factory()->create();
    $post = Post::factory()->for($user, 'author')->create([
        'audience' => PostAudience::Public->value,
    ]);

    $user->notifyNow(new UserFollowedNotification($actor));

    $notification = $user->notifications()->first();

    $this->actingAs($user)
        ->patchJson(route('notifications.mark-read', $notification))
        ->assertOk()
        ->assertJsonPath('id', $notification->getKey())
        ->assertJsonPath('unread_count', 0);

    expect($notification->fresh()->read_at)->not()->toBeNull();
});

it('marks all notifications as read', function (): void {
    $user = User::factory()->create();
    $actor = User::factory()->create();
    $post = Post::factory()->for($user, 'author')->create([
        'audience' => PostAudience::Public->value,
    ]);

    $user->notifyNow(new PostLikedNotification($actor, $post));
    $user->notifyNow(new PostBookmarkedNotification($actor, $post));

    $this->actingAs($user)
        ->postJson(route('notifications.mark-all-read'))
        ->assertOk()
        ->assertJsonPath('unread_count', 0);

    expect($user->unreadNotifications()->count())->toBe(0);
});


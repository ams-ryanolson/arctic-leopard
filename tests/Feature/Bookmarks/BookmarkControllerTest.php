<?php

use App\Enums\PostAudience;
use App\Models\Bookmark;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\Fluent\AssertableJson;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('allows an authenticated user to bookmark a post', function (): void {
    $user = User::factory()->create();
    $post = Post::factory()->create([
        'audience' => PostAudience::Public->value,
    ]);

    $this->actingAs($user);

    $response = $this->postJson(route('posts.bookmarks.store', $post));

    $response
        ->assertCreated()
        ->assertJson(fn (AssertableJson $json) => $json
            ->where('data.id', $post->getKey())
            ->where('data.is_bookmarked', true)
            ->where('data.bookmark_count', 1)
            ->whereNotNull('data.bookmark_id')
            ->etc());

    expect(Bookmark::query()->count())->toBe(1);
    expect($user->bookmarks()->where('post_id', $post->getKey())->exists())->toBeTrue();
});

it('is idempotent when bookmarking the same post twice', function (): void {
    $user = User::factory()->create();
    $post = Post::factory()->create([
        'audience' => PostAudience::Public->value,
    ]);

    $this->actingAs($user);

    $this->postJson(route('posts.bookmarks.store', $post))->assertCreated();
    $this->postJson(route('posts.bookmarks.store', $post))->assertOk();

    expect(Bookmark::query()->count())->toBe(1);
});

it('allows a user to remove a bookmark', function (): void {
    $user = User::factory()->create();
    $post = Post::factory()->create([
        'audience' => PostAudience::Public->value,
    ]);

    $this->actingAs($user);

    $this->postJson(route('posts.bookmarks.store', $post));

    $response = $this->deleteJson(route('posts.bookmarks.destroy', $post));

    $response
        ->assertOk()
        ->assertJsonPath('data.is_bookmarked', false)
        ->assertJsonPath('data.bookmark_count', 0);

    expect(Bookmark::query()->count())->toBe(0);
});

it('prevents bookmarking posts the user cannot view', function (): void {
    $user = User::factory()->create();
    $post = Post::factory()->create([
        'audience' => PostAudience::PayToView->value,
    ]);

    $this->actingAs($user);

    $this->postJson(route('posts.bookmarks.store', $post))
        ->assertForbidden();

    expect(Bookmark::query()->count())->toBe(0);
});

it('returns bookmarks as json when requested', function (): void {
    $user = User::factory()->create();
    $posts = Post::factory()
        ->count(2)
        ->create([
            'audience' => PostAudience::Public->value,
        ]);

    $this->actingAs($user);

    $posts->each(function (Post $post) use ($user): void {
        $this->postJson(route('posts.bookmarks.store', $post));
    });

    $response = $this->getJson(route('bookmarks.index'));

    $response->assertOk()
        ->assertJson(fn (AssertableJson $json) => $json
            ->has('data', 2)
            ->where('data.0.post.is_bookmarked', true)
            ->etc());
});

it('renders the bookmarks page via inertia', function (): void {
    $user = User::factory()->create();
    $posts = Post::factory()
        ->count(2)
        ->create([
            'audience' => PostAudience::Public->value,
        ]);

    $posts->each(function (Post $post) use ($user): void {
        Bookmark::query()->create([
            'user_id' => $user->getKey(),
            'post_id' => $post->getKey(),
        ]);
    });

    $this->actingAs($user);

    $response = $this->get(route('bookmarks.index'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Bookmarks/Index')
            ->has('bookmarks.data', 2)
            ->where('bookmarks.data.0.post.is_bookmarked', true));
});


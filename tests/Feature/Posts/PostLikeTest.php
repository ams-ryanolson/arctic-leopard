<?php

use App\Enums\PostAudience;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('allows an authenticated user to like a post', function (): void {
    $user = User::factory()->create();
    $post = Post::factory()->create(['audience' => PostAudience::Public->value]);

    Sanctum::actingAs($user);

    $response = $this->postJson(route('api.posts.like.store', $post));

    $response->assertOk()
        ->assertJsonPath('data.id', $post->getKey())
        ->assertJsonPath('data.has_liked', true);

    expect($post->fresh()->likes_count)->toBe(1);
    expect($user->hasLiked($post))->toBeTrue();
});

it('does not duplicate likes for the same user', function (): void {
    $user = User::factory()->create();
    $post = Post::factory()->create(['audience' => PostAudience::Public->value]);

    Sanctum::actingAs($user);

    $this->postJson(route('api.posts.like.store', $post));
    $this->postJson(route('api.posts.like.store', $post));

    expect($post->fresh()->likes_count)->toBe(1);
});

it('allows a user to unlike a post', function (): void {
    $user = User::factory()->create();
    $post = Post::factory()->create(['audience' => PostAudience::Public->value]);

    Sanctum::actingAs($user);

    $this->postJson(route('api.posts.like.store', $post));

    $response = $this->deleteJson(route('api.posts.like.destroy', $post));

    $response->assertOk()
        ->assertJsonPath('data.has_liked', false);

    expect($post->fresh()->likes_count)->toBe(0);
    expect($user->hasLiked($post))->toBeFalse();
});

<?php

use App\Enums\PostAudience;
use App\Enums\PostType;
use App\Models\Hashtag;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('hashtag index page displays hashtags', function () {
    $viewer = User::factory()->create();
    $hashtag = Hashtag::factory()->create([
        'name' => 'testhashtag',
        'slug' => 'testhashtag',
        'usage_count' => 10,
    ]);

    $this->actingAs($viewer);

    $response = $this->get('/hashtags');

    $response->assertSuccessful()
        ->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->component('Hashtags/Index')
            ->has('hashtags', 1)
        );
});

test('hashtag show page displays hashtag with posts', function () {
    $viewer = User::factory()->create();
    $user = User::factory()->create();
    $hashtag = Hashtag::factory()->create([
        'name' => 'testhashtag',
        'slug' => 'testhashtag',
        'usage_count' => 1,
    ]);

    $post = Post::factory()->create([
        'user_id' => $user->id,
        'type' => PostType::Text,
        'audience' => PostAudience::Public,
        'published_at' => now(),
    ]);

    $post->hashtags()->attach($hashtag->id, ['position' => 0]);

    $this->actingAs($viewer);

    $response = $this->get("/hashtags/{$hashtag->slug}");

    $response->assertSuccessful()
        ->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->component('Hashtags/Show')
            ->where('hashtag.name', 'testhashtag')
            ->where('posts', fn ($posts) => count($posts) === 1)
        );
});

test('hashtag posts API endpoint returns posts', function () {
    $user = User::factory()->create();
    $hashtag = Hashtag::factory()->create([
        'name' => 'testhashtag',
        'slug' => 'testhashtag',
    ]);

    $post = Post::factory()->create([
        'user_id' => $user->id,
        'type' => PostType::Text,
        'audience' => PostAudience::Public,
        'published_at' => now(),
    ]);

    $post->hashtags()->attach($hashtag->id, ['position' => 0]);

    $response = $this->getJson("/api/hashtags/{$hashtag->slug}/posts");

    $response->assertSuccessful();
    expect($response->json('data'))->toHaveCount(1);
});

test('hashtag show page calculates recent usage count', function () {
    $viewer = User::factory()->create();
    $user = User::factory()->create();
    $hashtag = Hashtag::factory()->create([
        'name' => 'testhashtag',
        'slug' => 'testhashtag',
    ]);

    // Create a post with hashtag from last 24 hours
    $post = Post::factory()->create([
        'user_id' => $user->id,
        'type' => PostType::Text,
        'audience' => PostAudience::Public,
        'published_at' => now(),
    ]);

    $post->hashtags()->attach($hashtag->id, [
        'position' => 0,
        'created_at' => now(),
    ]);

    $this->actingAs($viewer);

    $response = $this->get("/hashtags/{$hashtag->slug}");

    $response->assertSuccessful()
        ->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->component('Hashtags/Show')
            ->where('hashtag.recent_usage_count', fn ($count) => $count > 0)
        );
});

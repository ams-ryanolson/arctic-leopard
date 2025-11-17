<?php

use App\Enums\PostAudience;
use App\Enums\PostType;
use App\Models\Circle;
use App\Models\Post;
use App\Models\User;

test('an authenticated creator can publish a post via the web composer route', function () {
    $user = User::factory()->create([
        'profile_completed_at' => now(),
    ]);

    $this->actingAs($user);

    $response = $this->post(route('posts.store'), [
        'type' => PostType::Text->value,
        'audience' => PostAudience::Public->value,
        'body' => 'Tonight we light up the circle.',
        'is_pinned' => false,
        'scheduled_at' => null,
        'hashtags' => ['ropephoria'],
        'media' => [],
        'paywall_price' => null,
        'paywall_currency' => null,
        'extra_attributes' => null,
    ]);

    $response->assertRedirect(route('dashboard'));

    $post = Post::query()->first();

    expect($post)->not->toBeNull();
    expect($post->body)->toBe('Tonight we light up the circle.');
    expect($post->user_id)->toBe($user->getKey());
});

test('users without a completed profile cannot publish via the composer route', function () {
    $user = User::factory()->create([
        'profile_completed_at' => null,
    ]);

    $this->actingAs($user);

    $this->post(route('posts.store'), [
        'type' => PostType::Text->value,
        'audience' => PostAudience::Public->value,
        'body' => 'Unauthorized attempt.',
    ])->assertForbidden();

    expect(Post::query()->count())->toBe(0);
});

test('a post can be shared to all joined circles from the composer', function () {
    $user = User::factory()->create([
        'profile_completed_at' => now(),
    ]);

    $circle = Circle::factory()->create();
    $circle->members()->attach($user->getKey(), [
        'role' => 'member',
        'preferences' => null,
        'joined_at' => now(),
    ]);

    $this->actingAs($user);

    $this->post(route('posts.store'), [
        'type' => PostType::Text->value,
        'audience' => PostAudience::Public->value,
        'body' => 'Cross-posted into all my circles.',
        'post_to_circles' => true,
    ])->assertRedirect(route('dashboard'));

    $post = Post::query()->with('circles')->first();

    expect($post)->not->toBeNull();
    expect($post->circles)->toHaveCount(1);
    expect($post->circles->first()->getKey())->toBe($circle->getKey());
    expect((bool) $post->circles->first()->pivot->is_primary)->toBeTrue();
});

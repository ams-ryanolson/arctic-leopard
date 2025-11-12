<?php

use App\Models\Circle;
use App\Models\Post;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    $this->withoutExceptionHandling();
});

test('circles index renders for authenticated users', function (): void {
    $user = User::factory()->create();

    $featured = Circle::factory()->create([
        'name' => 'Leather Brotherhood',
        'slug' => 'leather-brotherhood',
        'is_featured' => true,
        'sort_order' => 1,
    ]);

    Circle::factory()->count(2)->create();

    $response = $this->actingAs($user)->get(route('circles.index'));

    $response->assertOk()->assertInertia(
        fn (Assert $page) => $page
            ->component('Circles/Index')
            ->has('featured', fn (Assert $collection) => $collection
                ->where('0.id', $featured->id)
                ->etc()
            )
            ->has('circles.data')
            ->has('filters', fn (Assert $props) => $props
                ->where('joined', false)
                ->etc()
            )
    );
});

test('users can join and leave circles', function (): void {
    $circle = Circle::factory()->create([
        'name' => 'Rubber Collective',
        'slug' => 'rubber-collective',
    ]);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('circles.join', $circle), [
            'role' => 'member',
        ])
        ->assertRedirect();

    expect($user->fresh()->circles()->whereKey($circle)->exists())->toBeTrue();

    $this->actingAs($user)
        ->delete(route('circles.leave', $circle))
        ->assertRedirect();

    expect($user->fresh()->circles()->whereKey($circle)->exists())->toBeFalse();
});

test('circle detail page includes circle payload', function (): void {
    $circle = Circle::factory()->create([
        'name' => 'Pup Pack',
        'slug' => 'pup-pack',
        'sort_order' => 5,
    ]);

    $post = Post::factory()->create();
    $circle->posts()->attach($post, ['is_primary' => true]);

    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('circles.show', $circle));

    $response->assertOk()->assertInertia(
        fn (Assert $page) => $page
            ->component('Circles/Show')
            ->where('circle.id', $circle->id)
            ->has('posts.data')
    );
});


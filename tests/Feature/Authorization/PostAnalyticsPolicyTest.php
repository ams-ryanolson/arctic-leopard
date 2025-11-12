<?php

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

it('allows the post author to view analytics', function (): void {
    $author = User::factory()->create();
    $post = Post::factory()->for($author, 'author')->create();

    expect($author->can('viewAnalytics', $post))->toBeTrue();
});

it('prevents other users from viewing analytics without permission', function (): void {
    $author = User::factory()->create();
    $post = Post::factory()->for($author, 'author')->create();

    $otherUser = User::factory()->create();

    expect($otherUser->can('viewAnalytics', $post))->toBeFalse();
});

it('allows users with analytics permissions to view analytics', function (): void {
    $author = User::factory()->create();
    $post = Post::factory()->for($author, 'author')->create();

    $analyst = User::factory()->create();

    Permission::findOrCreate('view analytics', 'web');

    $analyst->givePermissionTo('view analytics');

    expect($analyst->can('viewAnalytics', $post))->toBeTrue();
});

it('allows the post author to access the analytics route', function (): void {
    $author = User::factory()->create();
    $post = Post::factory()->for($author, 'author')->create();

    $this->actingAs($author);

    $response = $this->get(route('posts.analytics.show', $post));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Posts/Analytics')
            ->where('post.id', $post->getKey())
            ->where('can.viewAnalytics', true)
        );
});

it('forbids non-owners from accessing the analytics route', function (): void {
    $author = User::factory()->create();
    $post = Post::factory()->for($author, 'author')->create();

    $stranger = User::factory()->create();

    $this->actingAs($stranger);

    $response = $this->get(route('posts.analytics.show', $post));

    $response->assertForbidden();
});

it('redirects guests to login when accessing the analytics route', function (): void {
    $author = User::factory()->create();
    $post = Post::factory()->for($author, 'author')->create();

    $response = $this->get(route('posts.analytics.show', $post));

    $response->assertRedirect(route('login'));
});


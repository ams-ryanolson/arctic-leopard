<?php

use App\Enums\ModerationStatus;
use App\Models\ContentModerationQueue;
use App\Models\Post;
use App\Models\User;

use function Pest\Laravel\actingAs;

it('displays moderation queue with pending content', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $post = Post::factory()->create([
        'moderation_status' => ModerationStatus::Pending,
    ]);

    ContentModerationQueue::create([
        'moderatable_type' => Post::class,
        'moderatable_id' => $post->id,
        'status' => 'pending',
    ]);

    actingAs($admin)
        ->get('/admin/moderation')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('queue')
            ->has('filters')
        );
});

it('filters moderation queue by content type', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $post = Post::factory()->create();
    ContentModerationQueue::create([
        'moderatable_type' => Post::class,
        'moderatable_id' => $post->id,
        'status' => 'pending',
    ]);

    actingAs($admin)
        ->get('/admin/moderation?type=post')
        ->assertSuccessful();
});

it('filters moderation queue by status', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $post = Post::factory()->create([
        'moderation_status' => ModerationStatus::Approved,
    ]);

    ContentModerationQueue::create([
        'moderatable_type' => Post::class,
        'moderatable_id' => $post->id,
        'status' => 'approved',
    ]);

    actingAs($admin)
        ->get('/admin/moderation?status=approved')
        ->assertSuccessful();
});

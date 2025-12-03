<?php

use App\Enums\ModerationStatus;
use App\Events\Content\ContentApproved;
use App\Events\Content\ContentRejected;
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\Event;

use function Pest\Laravel\actingAs;

it('allows admin to approve content', function (): void {
    Event::fake([ContentApproved::class]);

    $admin = User::factory()->create([
        'email_verified_at' => now(),
        'profile_completed_at' => now(),
    ]);
    $admin->assignRole('Admin');

    $post = Post::factory()->create([
        'moderation_status' => ModerationStatus::Pending,
    ]);

    actingAs($admin)
        ->post("/admin/moderation/post/{$post->id}/approve", [
            'notes' => 'Content approved after review',
        ])
        ->assertRedirect();

    $post->refresh();

    expect($post->moderation_status)->toBe(ModerationStatus::Approved)
        ->and($post->moderated_by_id)->toBe($admin->id);

    Event::assertDispatched(ContentApproved::class);
});

it('allows admin to reject content', function (): void {
    Event::fake([ContentRejected::class]);

    $admin = User::factory()->create([
        'email_verified_at' => now(),
        'profile_completed_at' => now(),
    ]);
    $admin->assignRole('Admin');

    $post = Post::factory()->create([
        'moderation_status' => ModerationStatus::Pending,
    ]);

    actingAs($admin)
        ->post("/admin/moderation/post/{$post->id}/reject", [
            'reason' => 'Content violates community guidelines',
            'notes' => 'Inappropriate content',
        ])
        ->assertRedirect();

    $post->refresh();

    expect($post->moderation_status)->toBe(ModerationStatus::Rejected)
        ->and($post->rejection_reason)->toBe('Content violates community guidelines');

    Event::assertDispatched(ContentRejected::class);
});

it('requires rejection reason when rejecting content', function (): void {
    $admin = User::factory()->create([
        'email_verified_at' => now(),
        'profile_completed_at' => now(),
    ]);
    $admin->assignRole('Admin');

    $post = Post::factory()->create([
        'moderation_status' => ModerationStatus::Pending,
    ]);

    actingAs($admin)
        ->post("/admin/moderation/post/{$post->id}/reject", [
            'notes' => 'No reason provided',
        ])
        ->assertSessionHasErrors('reason');
});

it('blocks moderator from accessing admin moderation routes', function (): void {
    // NOTE: The /admin route group requires Admin|Super Admin role,
    // so Moderators are blocked at the parent level even though
    // the child /admin/moderation routes allow Moderators.
    // If moderator access is needed, routes should be restructured.
    // The Spatie middleware redirects unauthorized users rather than returning 403.
    $moderator = User::factory()->create([
        'email_verified_at' => now(),
        'profile_completed_at' => now(),
    ]);
    $moderator->assignRole('Moderator');

    actingAs($moderator)
        ->get('/admin/moderation')
        ->assertRedirect();
});

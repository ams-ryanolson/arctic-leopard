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

    $admin = User::factory()->create();
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

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $post = Post::factory()->create([
        'moderation_status' => ModerationStatus::Pending,
    ]);

    actingAs($admin)
        ->post("/admin/moderation/post/{$post->id}/reject", [
            'rejection_reason' => 'Content violates community guidelines',
            'notes' => 'Inappropriate content',
        ])
        ->assertRedirect();

    $post->refresh();

    expect($post->moderation_status)->toBe(ModerationStatus::Rejected)
        ->and($post->rejection_reason)->toBe('Content violates community guidelines');

    Event::assertDispatched(ContentRejected::class);
});

it('requires rejection reason when rejecting content', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $post = Post::factory()->create([
        'moderation_status' => ModerationStatus::Pending,
    ]);

    actingAs($admin)
        ->post("/admin/moderation/post/{$post->id}/reject", [
            'notes' => 'No reason provided',
        ])
        ->assertSessionHasErrors('rejection_reason');
});

it('allows moderator to moderate content', function (): void {
    $moderator = User::factory()->create();
    $moderator->assignRole('Moderator');

    $post = Post::factory()->create([
        'moderation_status' => ModerationStatus::Pending,
    ]);

    actingAs($moderator)
        ->get('/admin/moderation')
        ->assertSuccessful();
});

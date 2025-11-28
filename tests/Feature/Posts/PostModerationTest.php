<?php

use App\Enums\ModerationStatus;
use App\Models\AdminSetting;
use App\Models\Post;
use App\Models\User;

it('sets content to pending when moderation is required', function (): void {
    AdminSetting::create([
        'key' => 'content_moderation_required',
        'value' => 'true',
        'type' => 'boolean',
        'category' => 'moderation',
    ]);

    $user = User::factory()->create();

    $post = Post::factory()->create([
        'user_id' => $user->id,
        'moderation_status' => ModerationStatus::Pending,
    ]);

    expect($post->isPendingModeration())->toBeTrue()
        ->and($post->requiresModeration())->toBeTrue();
});

it('allows content to be approved when moderation is not required', function (): void {
    AdminSetting::create([
        'key' => 'content_moderation_required',
        'value' => 'false',
        'type' => 'boolean',
        'category' => 'moderation',
    ]);

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $post = Post::factory()->create([
        'moderation_status' => ModerationStatus::Approved,
    ]);

    expect($post->isApproved())->toBeTrue();
});

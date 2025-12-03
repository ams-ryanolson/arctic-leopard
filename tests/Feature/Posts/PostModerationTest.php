<?php

use App\Enums\ModerationStatus;
use App\Models\AdminSetting;
use App\Models\Post;
use App\Models\User;

it('sets content to pending when moderation is required', function (): void {
    AdminSetting::query()->updateOrCreate(
        ['key' => 'content_moderation_required'],
        ['value' => '1', 'type' => 'boolean', 'category' => 'moderation']
    );
    \Illuminate\Support\Facades\Cache::forget('admin_setting:content_moderation_required');

    $user = User::factory()->create();

    $post = Post::factory()->create([
        'user_id' => $user->id,
        'moderation_status' => ModerationStatus::Pending,
    ]);

    expect($post->isPendingModeration())->toBeTrue()
        ->and($post->requiresModeration())->toBeTrue();
});

it('allows content to be approved when moderation is not required', function (): void {
    AdminSetting::query()->updateOrCreate(
        ['key' => 'content_moderation_required'],
        ['value' => '0', 'type' => 'boolean', 'category' => 'moderation']
    );
    \Illuminate\Support\Facades\Cache::forget('admin_setting:content_moderation_required');

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $post = Post::factory()->create([
        'moderation_status' => ModerationStatus::Approved,
    ]);

    expect($post->isApproved())->toBeTrue();
});

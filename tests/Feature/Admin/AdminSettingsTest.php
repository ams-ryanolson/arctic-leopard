<?php

use App\Models\AdminSetting;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;

beforeEach(function (): void {
    AdminSetting::factory()->create([
        'key' => 'id_verification_expires_after_years',
        'value' => '1',
        'type' => 'integer',
        'category' => 'verification',
    ]);

    AdminSetting::factory()->create([
        'key' => 'id_verification_grace_period_days',
        'value' => '30',
        'type' => 'integer',
        'category' => 'verification',
    ]);
});

it('allows admin to view settings', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    actingAs($admin)
        ->get('/admin/settings')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('settings')
            ->has('categories')
        );
});

it('allows admin to update setting', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage settings');

    actingAs($admin)
        ->patchJson('/admin/settings/id_verification_expires_after_years', [
            'value' => 2,
        ])
        ->assertRedirect();

    assertDatabaseHas('admin_settings', [
        'key' => 'id_verification_expires_after_years',
        'value' => '2',
    ]);
});

it('requires admin permission to update settings', function (): void {
    $user = User::factory()->create();

    actingAs($user)
        ->patchJson('/admin/settings/id_verification_expires_after_years', [
            'value' => 2,
        ])
        ->assertForbidden();
});

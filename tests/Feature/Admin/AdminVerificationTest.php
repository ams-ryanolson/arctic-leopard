<?php

use App\Enums\VerificationStatus;
use App\Models\User;
use App\Models\Verification;
use App\Notifications\Verification\IdVerificationRenewalRequiredNotification;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\PermissionRegistrar;

use function Pest\Laravel\actingAs;

beforeEach(function (): void {
    Notification::fake();
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

it('allows admin to require re-verification for user', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    // Admin role already has manage users permission via seeder
    app(PermissionRegistrar::class)->forgetCachedPermissions();
    $admin->refresh();

    $user = User::factory()->create();

    $verification = Verification::factory()->create([
        'user_id' => $user->getKey(),
        'status' => VerificationStatus::Approved,
    ]);

    actingAs($admin)
        ->post("/admin/users/{$user->id}/require-reverification", [
            'compliance_note' => 'Random compliance check',
        ])
        ->assertRedirect();

    // Query verification directly from database to ensure we get the updated version
    $verification = Verification::query()->find($verification->id);

    expect($verification)->not->toBeNull()
        ->and($verification->status)->toBe(VerificationStatus::RenewalRequired)
        ->and($verification->renewal_required_at)->not->toBeNull()
        ->and($verification->compliance_note)->toBe('Random compliance check');

    Notification::assertSentTo($user, IdVerificationRenewalRequiredNotification::class);
});

it('requires compliance note to trigger re-verification', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    $admin->givePermissionTo('manage users');

    $user = User::factory()->create();

    actingAs($admin)
        ->postJson("/admin/users/{$user->id}/require-reverification", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['compliance_note']);
});

it('requires admin permission to trigger re-verification', function (): void {
    $user = User::factory()->create();
    $regularUser = User::factory()->create();

    actingAs($regularUser)
        ->post("/admin/users/{$user->id}/require-reverification", [
            'compliance_note' => 'Test note',
        ])
        ->assertRedirect(route('dashboard'));
});

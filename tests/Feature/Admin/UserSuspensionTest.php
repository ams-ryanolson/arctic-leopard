<?php

use App\Events\Users\UserSuspended;
use App\Events\Users\UserUnsuspended;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Event;

use function Pest\Laravel\actingAs;

it('allows admin to suspend a user', function (): void {
    Event::fake([UserSuspended::class]);

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $user = User::factory()->create();

    actingAs($admin)
        ->post("/admin/users/{$user->id}/suspend", [
            'reason' => 'Violation of terms of service',
        ])
        ->assertRedirect();

    $user->refresh();

    expect($user->isSuspended())->toBeTrue()
        ->and($user->suspended_at)->not->toBeNull()
        ->and($user->suspended_reason)->toBe('Violation of terms of service')
        ->and($user->suspended_by_id)->toBe($admin->id);

    Event::assertDispatched(UserSuspended::class, function ($event) use ($user, $admin): bool {
        return $event->user->id === $user->id
            && $event->reason === 'Violation of terms of service'
            && $event->admin->id === $admin->id;
    });
});

it('allows admin to suspend a user with expiry date', function (): void {
    Event::fake([UserSuspended::class]);

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $user = User::factory()->create();
    $suspendedUntil = Carbon::now()->addDays(7);

    actingAs($admin)
        ->post("/admin/users/{$user->id}/suspend", [
            'reason' => 'Temporary suspension',
            'suspended_until' => $suspendedUntil->toIso8601String(),
        ])
        ->assertRedirect();

    $user->refresh();

    expect($user->isSuspended())->toBeTrue()
        ->and($user->suspended_until->toIso8601String())->toBe($suspendedUntil->toIso8601String());

    Event::assertDispatched(UserSuspended::class, function ($event) use ($suspendedUntil): bool {
        return $event->until !== null
            && $event->until->toIso8601String() === $suspendedUntil->toIso8601String();
    });
});

it('allows admin to unsuspend a user', function (): void {
    Event::fake([UserUnsuspended::class]);

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $user = User::factory()->create();
    $user->suspend(until: Carbon::now()->addDays(7), reason: 'Test', admin: $admin);

    actingAs($admin)
        ->post("/admin/users/{$user->id}/unsuspend")
        ->assertRedirect();

    $user->refresh();

    expect($user->isSuspended())->toBeFalse()
        ->and($user->suspended_at)->toBeNull()
        ->and($user->suspended_until)->toBeNull()
        ->and($user->suspended_reason)->toBeNull();

    Event::assertDispatched(UserUnsuspended::class, function ($event) use ($user, $admin): bool {
        return $event->user->id === $user->id
            && $event->admin->id === $admin->id;
    });
});

it('prevents non-admin from suspending users', function (): void {
    $regularUser = User::factory()->create();
    $targetUser = User::factory()->create();

    actingAs($regularUser)
        ->post("/admin/users/{$targetUser->id}/suspend", [
            'reason' => 'Should not work',
        ])
        ->assertForbidden();
});

it('prevents admin from suspending themselves', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    actingAs($admin)
        ->post("/admin/users/{$admin->id}/suspend", [
            'reason' => 'Should not work',
        ])
        ->assertForbidden();
});

it('requires reason when suspending user', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $user = User::factory()->create();

    actingAs($admin)
        ->post("/admin/users/{$user->id}/suspend", [])
        ->assertSessionHasErrors('reason');
});

<?php

use App\Events\Users\UserWarned;
use App\Models\User;
use App\Models\UserWarning;
use Illuminate\Support\Facades\Event;

use function Pest\Laravel\actingAs;

it('allows admin to warn a user', function (): void {
    Event::fake([UserWarned::class]);

    $admin = User::factory()->create([
        'email_verified_at' => now(),
        'profile_completed_at' => now(),
    ]);
    $admin->assignRole('Admin');

    $user = User::factory()->create();

    actingAs($admin)
        ->post("/admin/users/{$user->id}/warn", [
            'reason' => 'Minor violation',
            'notes' => 'Internal note for admins',
        ])
        ->assertRedirect();

    $user->refresh();

    expect($user->warning_count)->toBe(1)
        ->and($user->last_warned_at)->not->toBeNull();

    $warning = $user->warnings()->first();

    expect($warning)->not->toBeNull()
        ->and($warning->reason)->toBe('Minor violation')
        ->and($warning->notes)->toBe('Internal note for admins')
        ->and($warning->warned_by_id)->toBe($admin->id)
        ->and($warning->expires_at)->not->toBeNull();

    Event::assertDispatched(UserWarned::class, function ($event) use ($user, $warning, $admin): bool {
        return $event->user->id === $user->id
            && $event->warning->id === $warning->id
            && $event->admin->id === $admin->id;
    });
});

it('creates warning with 90 day expiry', function (): void {
    $admin = User::factory()->create([
        'email_verified_at' => now(),
        'profile_completed_at' => now(),
    ]);
    $admin->assignRole('Admin');

    $user = User::factory()->create();

    actingAs($admin)
        ->post("/admin/users/{$user->id}/warn", [
            'reason' => 'Test warning',
        ])
        ->assertRedirect();

    $warning = UserWarning::where('user_id', $user->id)->first();

    expect($warning->expires_at)->not->toBeNull()
        // The difference should be approximately 90 days (use absolute value)
        ->and((int) abs(round($warning->expires_at->diffInDays(now()))))->toBe(90);
});

it('allows moderator to warn users', function (): void {
    $moderator = User::factory()->create([
        'email_verified_at' => now(),
        'profile_completed_at' => now(),
    ]);
    $moderator->assignRole('Moderator');

    $user = User::factory()->create();

    // Moderators don't have access to /admin routes, so this should fail
    // The route middleware is role_or_permission:Admin|Super Admin
    actingAs($moderator)
        ->postJson("/admin/users/{$user->id}/warn", [
            'reason' => 'Moderator warning',
        ])
        ->assertForbidden();
});

it('requires reason when warning user', function (): void {
    $admin = User::factory()->create([
        'email_verified_at' => now(),
        'profile_completed_at' => now(),
    ]);
    $admin->assignRole('Admin');

    $user = User::factory()->create();

    actingAs($admin)
        ->post("/admin/users/{$user->id}/warn", [])
        ->assertSessionHasErrors('reason');
});

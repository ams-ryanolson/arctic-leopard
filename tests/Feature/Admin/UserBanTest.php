<?php

use App\Events\Users\UserBanned;
use App\Events\Users\UserUnbanned;
use App\Models\User;
use Illuminate\Support\Facades\Event;

use function Pest\Laravel\actingAs;

it('allows admin to ban a user', function (): void {
    Event::fake([UserBanned::class]);

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $user = User::factory()->create();

    actingAs($admin)
        ->post("/admin/users/{$user->id}/ban", [
            'reason' => 'Severe violation of terms',
        ])
        ->assertRedirect();

    $user->refresh();

    expect($user->isBanned())->toBeTrue()
        ->and($user->banned_at)->not->toBeNull()
        ->and($user->banned_reason)->toBe('Severe violation of terms')
        ->and($user->banned_by_id)->toBe($admin->id);

    Event::assertDispatched(UserBanned::class, function ($event) use ($user, $admin): bool {
        return $event->user->id === $user->id
            && $event->reason === 'Severe violation of terms'
            && $event->admin->id === $admin->id;
    });
});

it('allows admin to unban a user', function (): void {
    Event::fake([UserUnbanned::class]);

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $user = User::factory()->create();
    $user->ban(reason: 'Test ban', admin: $admin);

    actingAs($admin)
        ->post("/admin/users/{$user->id}/unban")
        ->assertRedirect();

    $user->refresh();

    expect($user->isBanned())->toBeFalse()
        ->and($user->banned_at)->toBeNull()
        ->and($user->banned_reason)->toBeNull();

    Event::assertDispatched(UserUnbanned::class, function ($event) use ($user, $admin): bool {
        return $event->user->id === $user->id
            && $event->admin->id === $admin->id;
    });
});

it('requires reason when banning user', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $user = User::factory()->create();

    actingAs($admin)
        ->post("/admin/users/{$user->id}/ban", [])
        ->assertSessionHasErrors('reason');
});

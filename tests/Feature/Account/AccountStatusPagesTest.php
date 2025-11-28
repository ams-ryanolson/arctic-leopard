<?php

use App\Models\User;
use Illuminate\Support\Carbon;

use function Pest\Laravel\actingAs;

it('displays banned page with reason and warnings', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $user = User::factory()->create();
    $user->ban(reason: 'Severe violation', admin: $admin);
    $user->warn(reason: 'First warning', admin: $admin);

    actingAs($user)
        ->get('/account/banned')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('reason')
            ->has('banned_at')
            ->has('can_appeal')
            ->has('active_warnings')
        );
});

it('displays suspended page with expiry date', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $user = User::factory()->create();
    $suspendedUntil = Carbon::now()->addDays(7);
    $user->suspend(until: $suspendedUntil, reason: 'Temporary suspension', admin: $admin);

    actingAs($user)
        ->get('/account/suspended')
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('reason')
            ->has('suspended_until')
            ->has('can_appeal')
        );
});

it('redirects non-banned user away from banned page', function (): void {
    $user = User::factory()->create();

    actingAs($user)
        ->get('/account/banned')
        ->assertRedirect('/');
});

it('redirects non-suspended user away from suspended page', function (): void {
    $user = User::factory()->create();

    actingAs($user)
        ->get('/account/suspended')
        ->assertRedirect('/');
});

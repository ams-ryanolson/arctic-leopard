<?php

use App\Enums\VerificationStatus;
use App\Models\User;
use App\Models\Verification;

it('allows verified user to become creator', function (): void {
    $user = User::factory()->create();

    Verification::factory()->create([
        'user_id' => $user->getKey(),
        'status' => VerificationStatus::Approved,
        'verified_at' => now(),
        'expires_at' => now()->addYear(),
    ]);

    expect($user->can('be-creator'))->toBeTrue();
});

it('denies unverified user from becoming creator', function (): void {
    $user = User::factory()->create();

    expect($user->can('be-creator'))->toBeFalse();
});

it('denies user with expired verification from becoming creator', function (): void {
    $user = User::factory()->create();

    Verification::factory()->create([
        'user_id' => $user->getKey(),
        'status' => VerificationStatus::Approved,
        'verified_at' => now()->subYears(2),
        'expires_at' => now()->subYear(),
    ]);

    expect($user->can('be-creator'))->toBeFalse();
});

it('allows creator with valid verification to access creator features', function (): void {
    $user = User::factory()->create();
    $user->assignRole('Creator');

    Verification::factory()->create([
        'user_id' => $user->getKey(),
        'status' => VerificationStatus::Approved,
        'verified_at' => now(),
        'expires_at' => now()->addYear(),
    ]);

    expect($user->can('access-creator-features'))->toBeTrue();
});

it('denies creator with expired verification from accessing creator features after grace period', function (): void {
    $user = User::factory()->create();
    $user->assignRole('Creator');

    Verification::factory()->create([
        'user_id' => $user->getKey(),
        'status' => VerificationStatus::RenewalRequired,
        'verified_at' => now()->subYears(2),
        'expires_at' => now()->subDays(60),
        'renewal_required_at' => now()->subDays(60),
    ]);

    $user->update(['creator_status_disabled_at' => now()]);

    expect($user->can('access-creator-features'))->toBeFalse();
});

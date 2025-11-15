<?php

use App\Enums\VerificationStatus;
use App\Models\AdminSetting;
use App\Models\User;
use App\Models\Verification;
use App\Notifications\Verification\CreatorStatusDisabledNotification;
use App\Notifications\Verification\IdVerificationRenewalRequiredNotification;
use Illuminate\Support\Facades\Notification;

use function Pest\Laravel\artisan;

beforeEach(function (): void {
    Notification::fake();

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

it('marks verifications expiring soon as requiring renewal', function (): void {
    $user = User::factory()->create();

    $verification = Verification::factory()->create([
        'user_id' => $user->getKey(),
        'status' => VerificationStatus::Approved,
        'verified_at' => now()->subYear(),
        'expires_at' => now()->addDays(30),
        'renewal_required_at' => null,
    ]);

    artisan('verification:check-expirations')->assertSuccessful();

    $verification->refresh();

    expect($verification->status)->toBe(VerificationStatus::RenewalRequired)
        ->and($verification->renewal_required_at)->not->toBeNull();

    Notification::assertSentTo($user, IdVerificationRenewalRequiredNotification::class);
});

it('disables creator status after grace period expires', function (): void {
    $user = User::factory()->create([
        'creator_status_disabled_at' => null,
    ]);
    $user->assignRole('Creator');

    $verification = Verification::factory()->create([
        'user_id' => $user->getKey(),
        'status' => VerificationStatus::RenewalRequired,
        'verified_at' => now()->subYear()->subDays(60),
        'expires_at' => now()->subDays(60),
        'renewal_required_at' => now()->subDays(60),
        'creator_status_disabled_at' => null,
    ]);

    artisan('verification:check-expirations')->assertSuccessful();

    $user->refresh();
    $verification->refresh();

    expect($user->creator_status_disabled_at)->not->toBeNull()
        ->and($verification->creator_status_disabled_at)->not->toBeNull();

    Notification::assertSentTo($user, CreatorStatusDisabledNotification::class);
});

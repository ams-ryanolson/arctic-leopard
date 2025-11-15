<?php

use App\Enums\VerificationStatus;
use App\Models\AdminSetting;
use App\Models\Verification;

beforeEach(function (): void {
    AdminSetting::factory()->create([
        'key' => 'id_verification_grace_period_days',
        'value' => '30',
        'type' => 'integer',
        'category' => 'verification',
    ]);
});

it('checks if verification is approved', function (): void {
    $verification = Verification::factory()->approved()->create();

    expect($verification->isApproved())->toBeTrue();
});

it('checks if verification is expired', function (): void {
    $verification = Verification::factory()->create([
        'status' => VerificationStatus::Approved,
        'expires_at' => now()->subDay(),
    ]);

    expect($verification->isExpired())->toBeTrue();
});

it('checks if verification needs renewal', function (): void {
    $verification = Verification::factory()->renewalRequired()->create();

    expect($verification->needsRenewal())->toBeTrue();
});

it('checks if verification is in grace period', function (): void {
    $verification = Verification::factory()->create([
        'status' => VerificationStatus::Approved,
        'expires_at' => now()->addDays(15),
    ]);

    expect($verification->isInGracePeriod())->toBeTrue();
});

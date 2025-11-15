<?php

use App\Enums\VerificationProvider;
use App\Enums\VerificationStatus;
use App\Models\AdminSetting;
use App\Models\User;
use App\Models\Verification;
use App\Notifications\Verification\IdVerificationApprovedNotification;
use App\Services\Verification\SumsubService;
use App\Services\Verification\VerificationService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

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

    Http::fake([
        'api.sumsub.com/*' => Http::response([
            'id' => 'test-applicant-id',
        ], 200),
    ]);
});

it('initiates verification for user', function (): void {
    $user = User::factory()->create();
    $sumsubService = new SumsubService;
    $service = new VerificationService($sumsubService);

    $verification = $service->initiateVerification($user);

    expect($verification)->toBeInstanceOf(Verification::class)
        ->and($verification->user_id)->toBe($user->getKey())
        ->and($verification->provider)->toBe(VerificationProvider::Sumsub)
        ->and($verification->status)->toBe(VerificationStatus::Pending)
        ->and($verification->provider_applicant_id)->toBe('test-applicant-id');
});

it('handles verification approval and grants creator role', function (): void {
    $user = User::factory()->create();

    if (! Role::query()->where('name', 'Creator')->exists()) {
        Role::create(['name' => 'Creator', 'guard_name' => 'web']);
    }

    $verification = Verification::factory()->create([
        'user_id' => $user->getKey(),
        'status' => VerificationStatus::Pending,
    ]);

    $sumsubService = new SumsubService;
    $service = new VerificationService($sumsubService);

    $service->handleVerificationApproved($verification);

    $verification->refresh();
    $user->refresh();

    expect($verification->status)->toBe(VerificationStatus::Approved)
        ->and($verification->verified_at)->not->toBeNull()
        ->and($verification->expires_at)->not->toBeNull()
        ->and($user->hasRole('Creator'))->toBeTrue();

    Notification::assertSentTo($user, IdVerificationApprovedNotification::class);
});

it('handles verification rejection', function (): void {
    $user = User::factory()->create();

    $verification = Verification::factory()->create([
        'user_id' => $user->getKey(),
        'status' => VerificationStatus::Pending,
    ]);

    $metadata = [
        'rejection_reason' => 'Document quality insufficient',
    ];

    $sumsubService = new SumsubService;
    $service = new VerificationService($sumsubService);

    $service->handleVerificationRejected($verification, $metadata);

    $verification->refresh();

    expect($verification->status)->toBe(VerificationStatus::Rejected)
        ->and($verification->metadata)->toHaveKey('rejection_reason');
});

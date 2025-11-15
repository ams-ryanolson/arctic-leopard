<?php

use App\Enums\VerificationProvider;
use App\Enums\VerificationStatus;
use App\Models\AdminSetting;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Support\Facades\Queue;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\postJson;

beforeEach(function (): void {
    Queue::fake();
});

it('allows authenticated user to create verification session', function (): void {
    \Illuminate\Support\Facades\Http::fake([
        'api.sumsub.com/*' => \Illuminate\Support\Facades\Http::response([
            'id' => 'test-applicant-id',
        ], 200),
        'api.sumsub.com/resources/accessTokens' => \Illuminate\Support\Facades\Http::response([
            'token' => 'test-access-token',
        ], 200),
    ]);

    $user = User::factory()->create();

    AdminSetting::factory()->create([
        'key' => 'id_verification_provider',
        'value' => 'sumsub',
        'type' => 'string',
        'category' => 'verification',
    ]);

    actingAs($user)
        ->postJson('/api/settings/verification/session')
        ->assertSuccessful()
        ->assertJsonStructure([
            'access_token',
            'applicant_id',
            'verification_id',
        ]);

    assertDatabaseHas('verifications', [
        'user_id' => $user->getKey(),
        'provider' => VerificationProvider::Sumsub->value,
        'status' => VerificationStatus::Pending->value,
    ]);
});

it('requires authentication to create verification session', function (): void {
    postJson('/api/settings/verification/session')
        ->assertUnauthorized();
});

it('returns current verification status', function (): void {
    $user = User::factory()->create();

    $verification = Verification::factory()->create([
        'user_id' => $user->getKey(),
        'status' => VerificationStatus::Approved,
        'verified_at' => now(),
        'expires_at' => now()->addYear(),
    ]);

    actingAs($user)
        ->getJson('/api/settings/verification/status')
        ->assertSuccessful()
        ->assertJson([
            'status' => VerificationStatus::Approved->value,
        ]);
});

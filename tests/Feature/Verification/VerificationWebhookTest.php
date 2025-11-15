<?php

use App\Enums\VerificationProvider;
use App\Enums\VerificationStatus;
use App\Jobs\Verification\ProcessSumsubWebhook;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Support\Facades\Queue;

use function Pest\Laravel\postJson;

beforeEach(function (): void {
    Queue::fake();
});

it('accepts valid webhook from sumsub', function (): void {
    $user = User::factory()->create();

    $verification = Verification::factory()->create([
        'user_id' => $user->getKey(),
        'provider' => VerificationProvider::Sumsub,
        'provider_applicant_id' => 'test-applicant-id',
        'status' => VerificationStatus::Pending,
    ]);

    $payload = [
        'type' => 'applicantReviewed',
        'payload' => [
            'applicant' => [
                'id' => 'test-applicant-id',
            ],
            'reviewResult' => [
                'reviewAnswer' => 'GREEN',
            ],
        ],
    ];

    $signature = hash_hmac('sha256', json_encode($payload), config('verification.sumsub.webhook_secret', 'test-secret'));

    postJson('/api/webhooks/sumsub', $payload, [
        'X-Payload-Digest' => $signature,
    ])
        ->assertAccepted();

    Queue::assertPushed(ProcessSumsubWebhook::class);
});

it('rejects webhook with invalid signature', function (): void {
    $payload = [
        'type' => 'applicantReviewed',
        'payload' => [
            'applicant' => [
                'id' => 'test-applicant-id',
            ],
        ],
    ];

    postJson('/api/webhooks/sumsub', $payload, [
        'X-Payload-Digest' => 'invalid-signature',
    ])
        ->assertUnauthorized();
});

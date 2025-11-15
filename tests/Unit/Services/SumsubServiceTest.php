<?php

use App\Models\User;
use App\Services\Verification\SumsubService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

beforeEach(function (): void {
    Http::fake();
});

it('creates applicant in sumsub', function (): void {
    $user = User::factory()->create();

    Http::fake([
        'api.sumsub.com/*' => Http::response([
            'id' => 'test-applicant-id',
        ], 200),
    ]);

    $service = new SumsubService;

    $applicantId = $service->createApplicant($user);

    expect($applicantId)->toBe('test-applicant-id');

    Http::assertSent(function (Request $request): bool {
        return $request->url() === config('verification.sumsub.base_url', 'https://api.sumsub.com').'/resources/applicants'
            && $request->method() === 'POST'
            && isset($request->data()['externalUserId']);
    });
});

it('generates access token for websdk', function (): void {
    Http::fake([
        'api.sumsub.com/*' => Http::response([
            'token' => 'test-access-token',
        ], 200),
    ]);

    $service = new SumsubService;

    $token = $service->generateAccessToken('test-applicant-id');

    expect($token)->toBe('test-access-token');
});

it('verifies webhook signature correctly', function (): void {
    $service = new SumsubService;

    $payload = 'test-payload';
    $secret = config('verification.sumsub.webhook_secret', 'test-secret');
    $signature = hash_hmac('sha256', $payload, $secret);

    expect($service->verifyWebhookSignature($payload, $signature))->toBeTrue()
        ->and($service->verifyWebhookSignature($payload, 'invalid-signature'))->toBeFalse();
});

<?php

use App\Enums\Payments\PaymentIntentStatus;
use App\Enums\Payments\PaymentStatus;
use App\Enums\Payments\PaymentWebhookStatus;
use App\Jobs\Payments\ProcessPaymentWebhook;
use App\Models\Payments\Payment;
use App\Models\Payments\PaymentIntent;
use App\Models\Payments\PaymentWebhook;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Queue::fake();
});

it('stores CCBill webhook and dispatches processing job', function (): void {
    $payload = [
        'eventId' => 'evt_test_123',
        'type' => 'transaction.succeeded',
        'transactionId' => 'txn_test_12345',
        'amount' => 5000,
        'currency' => 'USD',
    ];

    $signature = hash_hmac('sha256', json_encode($payload), config('payments.gateways.ccbill.options.webhook_secret', 'test_secret'));

    $response = $this->postJson(route('webhooks.payments.store', ['provider' => 'ccbill']), $payload, [
        'X-CCBill-Signature' => $signature,
    ]);

    $response->assertAccepted();

    $webhook = PaymentWebhook::query()->firstOrFail();

    expect($webhook->provider)->toBe('ccbill')
        ->and($webhook->event)->toBe('transaction.succeeded')
        ->and($webhook->status)->toBe(PaymentWebhookStatus::Pending);

    Queue::assertPushed(ProcessPaymentWebhook::class, fn (ProcessPaymentWebhook $job) => $job->webhook->is($webhook));
});

it('verifies CCBill webhook signature', function (): void {
    $payload = ['type' => 'transaction.succeeded', 'transactionId' => 'txn_test_123'];
    $secret = 'test_webhook_secret';
    $signature = hash_hmac('sha256', json_encode($payload), $secret);

    config(['payments.gateways.ccbill.options.webhook_secret' => $secret]);
    config(['payments.gateways.ccbill.options.verify_webhook_signature' => true]);

    $response = $this->postJson(route('webhooks.payments.store', ['provider' => 'ccbill']), $payload, [
        'X-CCBill-Signature' => $signature,
    ]);

    $response->assertAccepted();
});

it('rejects webhook with invalid signature', function (): void {
    $payload = ['type' => 'transaction.succeeded', 'transactionId' => 'txn_test_123'];
    $secret = 'test_webhook_secret';
    $invalidSignature = 'invalid_signature';

    config(['payments.gateways.ccbill.options.webhook_secret' => $secret]);
    config(['payments.gateways.ccbill.options.verify_webhook_signature' => true]);

    $response = $this->postJson(route('webhooks.payments.store', ['provider' => 'ccbill']), $payload, [
        'X-CCBill-Signature' => $invalidSignature,
    ]);

    $response->assertUnprocessable();

    expect(PaymentWebhook::query()->count())->toBe(0);
});

it('processes payment succeeded webhook and updates payment status', function (): void {
    Queue::fake();

    $payment = Payment::factory()->create([
        'provider' => 'ccbill',
        'provider_payment_id' => 'txn_test_12345',
        'status' => PaymentStatus::Pending,
    ]);

    $intent = PaymentIntent::factory()->create([
        'payment_id' => $payment->id,
        'status' => PaymentIntentStatus::RequiresConfirmation,
    ]);

    $payload = [
        'eventId' => 'evt_test_123',
        'type' => 'transaction.succeeded',
        'transactionId' => 'txn_test_12345',
        'amount' => $payment->amount,
        'currency' => $payment->currency,
    ];

    $webhook = PaymentWebhook::create([
        'provider' => 'ccbill',
        'event' => 'transaction.succeeded',
        'payload' => $payload,
        'status' => PaymentWebhookStatus::Pending,
        'signature' => hash_hmac('sha256', json_encode($payload), 'test_secret'),
    ]);

    $processor = app(\App\Services\Payments\CCBillWebhookProcessor::class, [
        'config' => [
            'secret' => 'test_secret',
            'verify_signature' => false, // Disable for test
        ],
    ]);

    $processor->process($webhook);

    $payment->refresh();
    $intent->refresh();
    $webhook->refresh();

    expect($payment->status)->toBe(PaymentStatus::Captured)
        ->and($intent->status)->toBe(PaymentIntentStatus::Succeeded)
        ->and($webhook->status)->toBe(PaymentWebhookStatus::Processed)
        ->and($webhook->processed_at)->not->toBeNull();
});

it('processes payment failed webhook and updates payment status', function (): void {
    $payment = Payment::factory()->create([
        'provider' => 'ccbill',
        'provider_payment_id' => 'txn_test_12345',
        'status' => PaymentStatus::Pending,
    ]);

    $intent = PaymentIntent::factory()->create([
        'payment_id' => $payment->id,
        'status' => PaymentIntentStatus::RequiresConfirmation,
    ]);

    $payload = [
        'eventId' => 'evt_test_456',
        'type' => 'transaction.failed',
        'transactionId' => 'txn_test_12345',
        'failureReason' => 'Insufficient funds',
    ];

    $webhook = PaymentWebhook::create([
        'provider' => 'ccbill',
        'event' => 'transaction.failed',
        'payload' => $payload,
        'status' => PaymentWebhookStatus::Pending,
    ]);

    $processor = app(\App\Services\Payments\CCBillWebhookProcessor::class, [
        'config' => [
            'secret' => 'test_secret',
            'verify_signature' => false,
        ],
    ]);

    $processor->process($webhook);

    $payment->refresh();
    $intent->refresh();

    expect($payment->status)->toBe(PaymentStatus::Failed)
        ->and($intent->status)->toBe(PaymentIntentStatus::Failed)
        ->and($payment->metadata['failure_reason'])->toBe('Insufficient funds');
});

it('prevents duplicate webhook processing', function (): void {
    $payment = Payment::factory()->create([
        'provider' => 'ccbill',
        'provider_payment_id' => 'txn_test_12345',
        'status' => PaymentStatus::Pending,
    ]);

    $payload = [
        'eventId' => 'evt_test_123',
        'type' => 'transaction.succeeded',
        'transactionId' => 'txn_test_12345',
    ];

    // Create already processed webhook
    PaymentWebhook::create([
        'provider' => 'ccbill',
        'event' => 'transaction.succeeded',
        'payload' => $payload,
        'status' => PaymentWebhookStatus::Processed,
        'processed_at' => now(),
    ]);

    // Create new webhook with same event ID
    $webhook = PaymentWebhook::create([
        'provider' => 'ccbill',
        'event' => 'transaction.succeeded',
        'payload' => $payload,
        'status' => PaymentWebhookStatus::Pending,
    ]);

    $processor = app(\App\Services\Payments\CCBillWebhookProcessor::class, [
        'config' => [
            'secret' => 'test_secret',
            'verify_signature' => false,
        ],
    ]);

    $processor->process($webhook);

    $webhook->refresh();

    // Should be marked as processed without re-processing
    expect($webhook->status)->toBe(PaymentWebhookStatus::Processed)
        ->and($payment->status)->toBe(PaymentStatus::Pending); // Status unchanged
});

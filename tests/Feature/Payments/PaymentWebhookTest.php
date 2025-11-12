<?php

use App\Enums\Payments\PaymentWebhookStatus;
use App\Jobs\Payments\ProcessPaymentWebhook;
use App\Models\Payments\PaymentWebhook;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

it('stores the webhook payload and dispatches the processing job', function (): void {
    Queue::fake();

    $payload = [
        'type' => 'payment.succeeded',
        'data' => ['id' => 'pay_test_123'],
    ];

    $response = $this->postJson(route('webhooks.payments.store', ['provider' => 'fake']), $payload);

    $response->assertAccepted();

    $webhook = PaymentWebhook::query()->firstOrFail();

    expect($webhook->provider)->toBe('fake')
        ->and($webhook->event)->toBe('payment.succeeded')
        ->and($webhook->status)->toBe(PaymentWebhookStatus::Pending);

    Queue::assertPushed(ProcessPaymentWebhook::class, fn (ProcessPaymentWebhook $job) => $job->webhook->is($webhook));
});



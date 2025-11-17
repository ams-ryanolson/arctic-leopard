<?php

use App\Enums\Payments\PaymentIntentStatus;
use App\Enums\Payments\PaymentRefundStatus;
use App\Enums\Payments\PaymentStatus;
use App\Enums\Payments\PaymentType;
use App\Events\Payments\PaymentCancelled;
use App\Events\Payments\PaymentCaptured;
use App\Events\Payments\PaymentIntentCancelled;
use App\Events\Payments\PaymentIntentCreated;
use App\Events\Payments\PaymentIntentSucceeded;
use App\Events\Payments\PaymentRefunded;
use App\Models\Payments\Payment;
use App\Models\Payments\PaymentIntent;
use App\Models\User;
use App\Payments\Data\PaymentCaptureData;
use App\Payments\Data\PaymentIntentData;
use App\Payments\Data\PaymentRefundData;
use App\Payments\Gateways\FakeGateway;
use App\Services\Payments\PaymentService;
use App\ValueObjects\Money;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Event;

beforeEach(function (): void {
    FakeGateway::reset();
    Config::set('payments.default', 'fake');
});

function makePaymentService(): PaymentService
{
    return app(PaymentService::class);
}

function createIntentData(User $payer, User $payee): PaymentIntentData
{
    return new PaymentIntentData(
        payableType: PaymentIntent::class,
        payableId: 1,
        amount: Money::from(5000, 'USD'),
        payerId: $payer->id,
        payeeId: $payee->id,
        type: PaymentType::OneTime,
        method: 'card',
        metadata: ['test' => true],
        description: 'Test payment'
    );
}

it('creates a payment intent and payment records', function (): void {
    $payer = User::factory()->create();
    $payee = User::factory()->create();
    $service = makePaymentService();

    Event::fake([
        PaymentIntentCreated::class,
        PaymentIntentSucceeded::class,
    ]);

    $intent = $service->createIntent(createIntentData($payer, $payee));
    $payment = $intent->payment;

    expect($intent)->toBeInstanceOf(PaymentIntent::class)
        ->and($intent->status)->toBe(PaymentIntentStatus::RequiresConfirmation)
        ->and($payment)->toBeInstanceOf(Payment::class)
        ->and($payment->status)->toBe(PaymentStatus::Pending)
        ->and($payment->amount)->toBe(5000);

    Event::assertDispatched(PaymentIntentCreated::class);
});

it('confirms a payment intent and updates status', function (): void {
    $payer = User::factory()->create();
    $payee = User::factory()->create();
    $service = makePaymentService();

    $intent = $service->createIntent(createIntentData($payer, $payee));

    Event::fake([PaymentIntentSucceeded::class]);

    $result = $service->confirmIntent($intent, ['status' => 'succeeded']);

    expect($result->status)->toBe(PaymentIntentStatus::Succeeded);
    Event::assertDispatched(PaymentIntentSucceeded::class);
});

it('cancels a payment intent and underlying payment', function (): void {
    $payer = User::factory()->create();
    $payee = User::factory()->create();
    $service = makePaymentService();

    $intent = $service->createIntent(createIntentData($payer, $payee));

    Event::fake([PaymentCancelled::class, PaymentIntentCancelled::class]);

    $result = $service->cancelIntent($intent, ['status' => 'cancelled']);

    expect($result->status)->toBe(PaymentIntentStatus::Cancelled)
        ->and($result->payment->status)->toBe(PaymentStatus::Cancelled);

    Event::assertDispatched(PaymentIntentCancelled::class);
    Event::assertDispatched(PaymentCancelled::class);
});

it('captures a payment and marks it successful', function (): void {
    $payer = User::factory()->create();
    $payee = User::factory()->create();
    $service = makePaymentService();

    $intent = $service->createIntent(createIntentData($payer, $payee));

    Event::fake([PaymentCaptured::class, PaymentIntentSucceeded::class]);

    $payment = $service->capture(
        $intent,
        new PaymentCaptureData(
            providerIntentId: $intent->provider_intent_id,
            amount: Money::from(5000, 'USD')
        )
    );

    expect($payment->status)->toBe(PaymentStatus::Captured)
        ->and($payment->net_amount)->toBe(5000)
        ->and($intent->refresh()->status)->toBe(PaymentIntentStatus::Succeeded);

    Event::assertDispatched(PaymentCaptured::class);
    Event::assertDispatched(PaymentIntentSucceeded::class);
});

it('refunds a payment and records refund information', function (): void {
    $payer = User::factory()->create();
    $payee = User::factory()->create();
    $service = makePaymentService();

    $intent = $service->createIntent(createIntentData($payer, $payee));

    $payment = $service->capture(
        $intent,
        new PaymentCaptureData(
            providerIntentId: $intent->provider_intent_id,
            amount: Money::from(5000, 'USD')
        )
    );

    Event::fake([
        PaymentRefunded::class,
    ]);

    $refund = $service->refund(
        $payment,
        new PaymentRefundData(
            providerPaymentId: $payment->provider_payment_id,
            amount: Money::from(5000, 'USD'),
            reason: 'requested'
        )
    );

    expect($refund->status)->toBe(PaymentRefundStatus::Succeeded)
        ->and($payment->refresh()->status)->toBe(PaymentStatus::Refunded);

    Event::assertDispatched(PaymentRefunded::class);
});

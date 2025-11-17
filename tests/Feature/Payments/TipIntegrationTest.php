<?php

use App\Enums\Payments\LedgerDirection;
use App\Enums\Payments\TipStatus;
use App\Models\Payments\LedgerEntry;
use App\Models\User;
use App\Payments\Data\PaymentCaptureData;
use App\Payments\Data\PaymentRefundData;
use App\Payments\Gateways\FakeGateway;
use App\Services\Payments\PaymentService;
use App\Services\Payments\TipService;
use App\ValueObjects\Money;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Spatie\Activitylog\Models\Activity;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    FakeGateway::reset();
    Config::set('payments.default', 'fake');
});

it('processes a tip through capture and refund lifecycle', function (): void {
    $sender = User::factory()->create();
    $recipient = User::factory()->create();

    /** @var TipService $tips */
    $tips = app(TipService::class);
    /** @var PaymentService $payments */
    $payments = app(PaymentService::class);

    [$tip, $intent] = $tips->initiate(
        new \App\Payments\Data\TipData(
            senderId: $sender->id,
            recipientId: $recipient->id,
            amount: Money::from(2500, 'USD'),
            method: 'card',
            message: 'Great content!',
            metadata: ['source' => 'integration-test']
        )
    );

    $payment = $payments->capture(
        $intent,
        new PaymentCaptureData(
            providerIntentId: $intent->provider_intent_id,
            amount: Money::from(2500, 'USD')
        )
    );

    $tip = $tip->refresh();

    expect($tip->status)->toBe(TipStatus::Completed)
        ->and(LedgerEntry::query()->where('payment_id', $payment->id)->count())->toBe(2)
        ->and(LedgerEntry::query()->where('payment_id', $payment->id)->where('direction', LedgerDirection::Credit)->exists())->toBeTrue()
        ->and(Activity::query()->where('log_name', 'payments')->exists())->toBeTrue();

    $refund = $payments->refund(
        $payment,
        new PaymentRefundData(
            providerPaymentId: $payment->provider_payment_id,
            amount: Money::from(2500, 'USD'),
            reason: 'content not delivered'
        )
    );

    $tip->refresh();

    expect($refund->amount)->toBe(2500)
        ->and($tip->status)->toBe(TipStatus::Refunded);
});

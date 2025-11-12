<?php

namespace App\Payments\Gateways;

use App\Payments\Contracts\PaymentGatewayContract;
use App\Payments\Contracts\SubscriptionGatewayContract;
use App\Payments\Data\PaymentCaptureData;
use App\Payments\Data\PaymentIntentData;
use App\Payments\Data\PaymentIntentResponse;
use App\Payments\Data\PaymentRefundData;
use App\Payments\Data\PaymentRefundResponse;
use App\Payments\Data\PaymentResponse;
use App\Payments\Data\SubscriptionCancelData;
use App\Payments\Data\SubscriptionCreateData;
use App\Payments\Data\SubscriptionResponse;
use App\Payments\Data\SubscriptionResumeData;
use App\Payments\Data\SubscriptionSwapData;
use Illuminate\Support\Str;

class FakeGateway implements PaymentGatewayContract, SubscriptionGatewayContract
{
    /**
     * @param array<string, mixed> $config
     */
    public function __construct(
        protected array $config = []
    ) {
    }

    public function identifier(): string
    {
        return 'fake';
    }

    public function createIntent(PaymentIntentData $data): PaymentIntentResponse
    {
        $id = $this->generateId('pi');

        $record = [
            'id' => $id,
            'status' => $this->config['intent_status'] ?? 'requires_confirmation',
            'amount' => $data->amount,
            'metadata' => $data->metadata,
            'payer_id' => $data->payerId,
            'payee_id' => $data->payeeId,
            'type' => $data->type?->value,
            'method' => $data->method,
        ];

        FakeGatewayStore::$intents[$id] = $record;

        return new PaymentIntentResponse(
            provider: $this->identifier(),
            providerIntentId: $id,
            status: $record['status'],
            clientSecret: $this->config['client_secret'] ?? Str::random(32),
            raw: $record
        );
    }

    public function confirmIntent(string $providerIntentId, array $context = []): PaymentIntentResponse
    {
        $intent = FakeGatewayStore::$intents[$providerIntentId] ?? null;

        if ($intent === null) {
            throw new \RuntimeException("Intent [{$providerIntentId}] not found.");
        }

        $intent['status'] = $context['status'] ?? 'requires_capture';
        FakeGatewayStore::$intents[$providerIntentId] = $intent;

        return PaymentIntentResponse::fromArray([
            'provider' => $this->identifier(),
            'provider_intent_id' => $providerIntentId,
            'status' => $intent['status'],
            'raw' => $intent,
        ]);
    }

    public function cancelIntent(string $providerIntentId, array $context = []): PaymentIntentResponse
    {
        $intent = FakeGatewayStore::$intents[$providerIntentId] ?? null;

        if ($intent === null) {
            throw new \RuntimeException("Intent [{$providerIntentId}] not found.");
        }

        $intent['status'] = 'cancelled';
        FakeGatewayStore::$intents[$providerIntentId] = $intent;

        return PaymentIntentResponse::fromArray([
            'provider' => $this->identifier(),
            'provider_intent_id' => $providerIntentId,
            'status' => $intent['status'],
            'raw' => $intent,
        ]);
    }

    public function capturePayment(PaymentCaptureData $data): PaymentResponse
    {
        $paymentId = $this->generateId('pay');
        $status = $this->config['capture_status'] ?? 'captured';

        $record = [
            'id' => $paymentId,
            'status' => $status,
            'amount' => $data->amount,
            'intent_id' => $data->providerIntentId,
            'metadata' => $data->metadata,
        ];

        FakeGatewayStore::$payments[$paymentId] = $record;

        return PaymentResponse::fromArray([
            'provider' => $this->identifier(),
            'provider_payment_id' => $paymentId,
            'status' => $status,
            'amount' => $data->amount->amount(),
            'currency' => $data->amount->currency(),
            'raw' => $record,
        ]);
    }

    public function refundPayment(PaymentRefundData $data): PaymentRefundResponse
    {
        $refundId = $this->generateId('re');
        $status = $this->config['refund_status'] ?? 'succeeded';

        $record = [
            'id' => $refundId,
            'status' => $status,
            'amount' => $data->amount,
            'payment_id' => $data->providerPaymentId,
            'metadata' => $data->metadata,
        ];

        FakeGatewayStore::$refunds[$refundId] = $record;

        return PaymentRefundResponse::fromArray([
            'provider' => $this->identifier(),
            'provider_refund_id' => $refundId,
            'status' => $status,
            'amount' => $data->amount->amount(),
            'currency' => $data->amount->currency(),
            'raw' => $record,
        ]);
    }

    public function createSubscription(SubscriptionCreateData $data): SubscriptionResponse
    {
        $subscriptionId = $this->generateId('sub');
        $status = $this->config['subscription_status'] ?? 'active';

        $record = [
            'id' => $subscriptionId,
            'status' => $status,
            'amount' => $data->amount,
            'subscriber_id' => $data->subscriberId,
            'creator_id' => $data->creatorId,
            'interval' => $data->interval,
            'interval_count' => $data->intervalCount,
            'auto_renews' => $data->autoRenews,
            'trial_days' => $data->trialDays,
            'metadata' => $data->metadata,
        ];

        FakeGatewayStore::$subscriptions[$subscriptionId] = $record;

        return SubscriptionResponse::fromArray([
            'provider' => $this->identifier(),
            'provider_subscription_id' => $subscriptionId,
            'status' => $status,
            'raw' => $record,
        ]);
    }

    public function swapSubscription(SubscriptionSwapData $data): SubscriptionResponse
    {
        $subscription = FakeGatewayStore::$subscriptions[$data->providerSubscriptionId] ?? null;

        if ($subscription === null) {
            throw new \RuntimeException("Subscription [{$data->providerSubscriptionId}] not found.");
        }

        $subscription['amount'] = $data->amount;
        $subscription['interval'] = $data->interval;
        $subscription['interval_count'] = $data->intervalCount;
        $subscription['metadata'] = array_merge($subscription['metadata'], $data->metadata);

        FakeGatewayStore::$subscriptions[$data->providerSubscriptionId] = $subscription;

        return SubscriptionResponse::fromArray([
            'provider' => $this->identifier(),
            'provider_subscription_id' => $data->providerSubscriptionId,
            'status' => $subscription['status'],
            'raw' => $subscription,
        ]);
    }

    public function cancelSubscription(SubscriptionCancelData $data): SubscriptionResponse
    {
        $subscription = FakeGatewayStore::$subscriptions[$data->providerSubscriptionId] ?? null;

        if ($subscription === null) {
            throw new \RuntimeException("Subscription [{$data->providerSubscriptionId}] not found.");
        }

        $subscription['status'] = $data->immediate ? 'cancelled' : 'active';
        $subscription['metadata']['cancel_reason'] = $data->reason;
        $subscription['metadata']['immediate'] = $data->immediate;

        FakeGatewayStore::$subscriptions[$data->providerSubscriptionId] = $subscription;

        return SubscriptionResponse::fromArray([
            'provider' => $this->identifier(),
            'provider_subscription_id' => $data->providerSubscriptionId,
            'status' => $subscription['status'],
            'raw' => $subscription,
        ]);
    }

    public function resumeSubscription(SubscriptionResumeData $data): SubscriptionResponse
    {
        $subscription = FakeGatewayStore::$subscriptions[$data->providerSubscriptionId] ?? null;

        if ($subscription === null) {
            throw new \RuntimeException("Subscription [{$data->providerSubscriptionId}] not found.");
        }

        $subscription['status'] = 'active';
        $subscription['metadata']['resumed_with'] = $data->paymentMethodToken;

        FakeGatewayStore::$subscriptions[$data->providerSubscriptionId] = $subscription;

        return SubscriptionResponse::fromArray([
            'provider' => $this->identifier(),
            'provider_subscription_id' => $data->providerSubscriptionId,
            'status' => $subscription['status'],
            'raw' => $subscription,
        ]);
    }

    /**
     * Reset the fake gateway state.
     */
    public static function reset(): void
    {
        FakeGatewayStore::reset();
    }

    protected function generateId(string $prefix): string
    {
        return $prefix . '_' . Str::lower(Str::random(24));
    }
}


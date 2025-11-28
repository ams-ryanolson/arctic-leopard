<?php

namespace App\Services\Payments;

use App\Enums\Payments\PaymentIntentStatus;
use App\Enums\Payments\PaymentRefundStatus;
use App\Enums\Payments\PaymentStatus;
use App\Enums\Payments\PaymentType;
use App\Events\Payments\PaymentCancelled;
use App\Events\Payments\PaymentCaptured;
use App\Events\Payments\PaymentFailed;
use App\Events\Payments\PaymentInitiated;
use App\Events\Payments\PaymentIntentCancelled;
use App\Events\Payments\PaymentIntentCreated;
use App\Events\Payments\PaymentIntentSucceeded;
use App\Events\Payments\PaymentRefunded;
use App\Models\Payments\Payment;
use App\Models\Payments\PaymentIntent;
use App\Models\Payments\PaymentRefund;
use App\Payments\Data\PaymentCaptureData;
use App\Payments\Data\PaymentIntentData;
use App\Payments\Data\PaymentRefundData;
use App\Payments\PaymentGatewayManager;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

class PaymentService
{
    public function __construct(
        protected readonly PaymentGatewayManager $gateways
    ) {}

    public function createIntent(PaymentIntentData $data, ?string $gateway = null): PaymentIntent
    {
        $gateway = $gateway ?? $this->gateways->getDefaultDriver();

        $response = $this->gateways->driver($gateway)->createIntent($data);

        return DB::transaction(function () use ($data, $response) {
            $feeAmount = $data->metadata['fee_amount'] ?? 0;
            $netAmount = $data->amount->amount() - $feeAmount;

            $payment = Payment::query()->create([
                'payable_type' => $data->payableType,
                'payable_id' => $data->payableId,
                'payer_id' => $data->payerId,
                'payee_id' => $data->payeeId,
                'type' => ($data->type ?? PaymentType::OneTime)->value,
                'status' => PaymentStatus::Pending,
                'amount' => $data->amount->amount(),
                'fee_amount' => $feeAmount,
                'net_amount' => $netAmount,
                'currency' => $data->amount->currency(),
                'method' => $data->method,
                'provider' => $response->provider,
                'provider_payment_id' => null,
                'provider_customer_id' => null,
                'metadata' => array_merge($data->metadata, [
                    'intent_reference' => $response->providerIntentId,
                ]),
            ]);

            Event::dispatch(new PaymentInitiated($payment));

            $intent = PaymentIntent::query()->create([
                'payment_id' => $payment->id,
                'payable_type' => $data->payableType,
                'payable_id' => $data->payableId,
                'payer_id' => $data->payerId,
                'payee_id' => $data->payeeId,
                'amount' => $data->amount->amount(),
                'currency' => $data->amount->currency(),
                'type' => ($data->type ?? PaymentType::OneTime)->value,
                'method' => $data->method,
                'status' => $this->mapIntentStatus($response->status),
                'provider' => $response->provider,
                'provider_intent_id' => $response->providerIntentId,
                'client_secret' => $response->clientSecret,
                'metadata' => $data->metadata,
            ]);

            Event::dispatch(new PaymentIntentCreated($intent));

            return $intent;
        });
    }

    public function confirmIntent(PaymentIntent $intent, array $context = [], ?string $gateway = null): PaymentIntent
    {
        $gateway = $gateway ?? $intent->provider ?? $this->gateways->getDefaultDriver();

        $response = $this->gateways->driver($gateway)->confirmIntent($intent->provider_intent_id, $context);

        return DB::transaction(function () use ($intent, $response) {
            $intent->status = $this->mapIntentStatus($response->status);
            $intent->metadata = array_merge($intent->metadata ?? [], [
                'confirmation' => $response->raw,
            ]);
            $intent->confirmed_at = Carbon::now();
            $intent->save();

            if ($intent->status === PaymentIntentStatus::Cancelled) {
                Event::dispatch(new PaymentIntentCancelled($intent));
            } elseif ($intent->status === PaymentIntentStatus::Succeeded) {
                Event::dispatch(new PaymentIntentSucceeded($intent));
            }

            return $intent;
        });
    }

    public function cancelIntent(PaymentIntent $intent, array $context = [], ?string $gateway = null): PaymentIntent
    {
        $gateway = $gateway ?? $intent->provider ?? $this->gateways->getDefaultDriver();

        $response = $this->gateways->driver($gateway)->cancelIntent($intent->provider_intent_id, $context);

        return DB::transaction(function () use ($intent, $response) {
            $intent->status = $this->mapIntentStatus($response->status);
            $intent->cancelled_at = Carbon::now();
            $intent->metadata = array_merge($intent->metadata ?? [], [
                'cancellation' => $response->raw,
            ]);
            $intent->save();

            $payment = $intent->payment()->lockForUpdate()->first();

            if ($payment !== null) {
                $payment->status = PaymentStatus::Cancelled;
                $payment->metadata = array_merge($payment->metadata ?? [], [
                    'cancellation' => $response->raw,
                ]);
                $payment->cancelled_at = Carbon::now();
                $payment->save();

                Event::dispatch(new PaymentCancelled($payment));
            }

            Event::dispatch(new PaymentIntentCancelled($intent));

            return $intent;
        });
    }

    public function capture(PaymentIntent $intent, PaymentCaptureData $data, ?string $gateway = null, ?int $paymentMethodId = null): Payment
    {
        $gateway = $gateway ?? $intent->provider ?? $this->gateways->getDefaultDriver();

        // If payment method ID is provided, add it to metadata for gateway use
        if ($paymentMethodId !== null) {
            $data = new PaymentCaptureData(
                providerIntentId: $data->providerIntentId,
                amount: $data->amount,
                metadata: array_merge($data->metadata, [
                    'payment_method_id' => $paymentMethodId,
                ]),
                statementDescriptor: $data->statementDescriptor
            );
        }

        $response = $this->gateways->driver($gateway)->capturePayment($data);

        return DB::transaction(function () use ($intent, $response, $paymentMethodId) {
            $payment = $intent->payment()->lockForUpdate()->firstOrFail();

            $payment->provider_payment_id = $response->providerPaymentId;
            $payment->status = $this->mapPaymentStatus($response->status);
            $payment->amount = $response->amount->amount();
            $payment->currency = $response->amount->currency();
            $payment->net_amount = $response->amount->amount();
            $payment->captured_at = Carbon::now();
            $payment->succeeded_at = Carbon::now();

            // Associate payment method if provided
            if ($paymentMethodId !== null) {
                $payment->payment_method_id = $paymentMethodId;
            }

            $payment->metadata = array_merge($payment->metadata ?? [], [
                'capture' => $response->raw,
            ]);
            $payment->save();

            $intent->status = PaymentIntentStatus::Succeeded;
            $intent->metadata = array_merge($intent->metadata ?? [], [
                'captured_with' => $response->providerPaymentId,
            ]);
            $intent->save();

            if ($payment->status === PaymentStatus::Failed) {
                Event::dispatch(new PaymentFailed($payment));
            } else {
                Event::dispatch(new PaymentCaptured($payment));
                Event::dispatch(new PaymentIntentSucceeded($intent));
            }

            return $payment;
        });
    }

    public function refund(Payment $payment, PaymentRefundData $data, ?string $gateway = null): PaymentRefund
    {
        $gateway = $gateway ?? $payment->provider ?? $this->gateways->getDefaultDriver();

        $response = $this->gateways->driver($gateway)->refundPayment($data);

        return DB::transaction(function () use ($payment, $response, $data) {
            $refund = PaymentRefund::query()->create([
                'payment_id' => $payment->id,
                'amount' => $response->amount->amount(),
                'currency' => $response->amount->currency(),
                'status' => $this->mapRefundStatus($response->status),
                'reason' => $data->reason,
                'provider' => $response->provider,
                'provider_refund_id' => $response->providerRefundId,
                'metadata' => $response->raw,
                'processed_at' => Carbon::now(),
            ]);

            $payment->status = PaymentStatus::Refunded;
            $payment->refunded_at = Carbon::now();
            $payment->metadata = array_merge($payment->metadata ?? [], [
                'refund' => $response->raw,
            ]);
            $payment->save();

            Event::dispatch(new PaymentRefunded($payment, $refund));

            return $refund;
        });
    }

    protected function mapIntentStatus(string $status): PaymentIntentStatus
    {
        return match (strtolower($status)) {
            'requires_method', 'requires_payment_method' => PaymentIntentStatus::RequiresMethod,
            'requires_confirmation', 'requires_action' => PaymentIntentStatus::RequiresConfirmation,
            'processing', 'requires_capture' => PaymentIntentStatus::Processing,
            'succeeded', 'paid' => PaymentIntentStatus::Succeeded,
            'cancelled', 'canceled' => PaymentIntentStatus::Cancelled,
            'failed' => PaymentIntentStatus::Failed,
            default => PaymentIntentStatus::Pending,
        };
    }

    protected function mapPaymentStatus(string $status): PaymentStatus
    {
        return match (strtolower($status)) {
            'pending', 'requires_confirmation', 'requires_capture', 'processing' => PaymentStatus::Pending,
            'authorized' => PaymentStatus::Authorized,
            'captured', 'paid', 'succeeded' => PaymentStatus::Captured,
            'settled' => PaymentStatus::Settled,
            'failed' => PaymentStatus::Failed,
            'refunded' => PaymentStatus::Refunded,
            'cancelled', 'canceled' => PaymentStatus::Cancelled,
            default => PaymentStatus::Pending,
        };
    }

    protected function mapRefundStatus(string $status): PaymentRefundStatus
    {
        return match (strtolower($status)) {
            'pending' => PaymentRefundStatus::Pending,
            'processing' => PaymentRefundStatus::Processing,
            'succeeded', 'completed' => PaymentRefundStatus::Succeeded,
            'failed' => PaymentRefundStatus::Failed,
            default => PaymentRefundStatus::Pending,
        };
    }
}

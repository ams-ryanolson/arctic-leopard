<?php

namespace App\Services\Payments;

use App\Models\Payments\Payment;
use App\Models\Payments\PaymentIntent;
use App\Models\Payments\PaymentWebhook;
use App\Payments\Exceptions\CCBillApiException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CCBillWebhookProcessor
{
    protected string $webhookSecret;

    protected bool $verifySignature;

    public function __construct(array $config)
    {
        $this->webhookSecret = $config['secret'] ?? '';
        $this->verifySignature = (bool) ($config['verify_signature'] ?? true);
    }

    /**
     * Verify webhook signature from CCBill.
     * CCBill uses HMAC-SHA256 with the webhook secret.
     */
    public function verifySignature(string $payload, string $signature): bool
    {
        if (! $this->verifySignature || empty($this->webhookSecret)) {
            return true; // Skip verification if disabled or secret not configured
        }

        $expectedSignature = hash_hmac('sha256', $payload, $this->webhookSecret);

        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Process a CCBill webhook.
     */
    public function process(PaymentWebhook $webhook): void
    {
        $correlationId = Str::uuid()->toString();

        Log::info('CCBillWebhookProcessor: Processing webhook', [
            'correlation_id' => $correlationId,
            'webhook_id' => $webhook->id,
            'event' => $webhook->event,
        ]);

        try {
            // Verify signature if enabled
            $payload = json_encode($webhook->payload);
            $signature = $webhook->signature ?? '';

            if (! $this->verifySignature($payload, $signature)) {
                Log::warning('CCBillWebhookProcessor: Invalid signature', [
                    'correlation_id' => $correlationId,
                    'webhook_id' => $webhook->id,
                ]);

                $webhook->update([
                    'status' => \App\Enums\Payments\PaymentWebhookStatus::Failed,
                    'error' => 'Invalid signature',
                ]);

                return;
            }

            // Check for idempotency (prevent duplicate processing)
            if ($this->isAlreadyProcessed($webhook)) {
                Log::info('CCBillWebhookProcessor: Webhook already processed', [
                    'correlation_id' => $correlationId,
                    'webhook_id' => $webhook->id,
                ]);

                $webhook->update([
                    'status' => \App\Enums\Payments\PaymentWebhookStatus::Processed,
                    'processed_at' => now(),
                ]);

                return;
            }

            // Map CCBill event to our internal event type
            $eventType = $this->mapEventType($webhook->event, $webhook->payload);

            // Process based on event type
            match ($eventType) {
                'payment.succeeded' => $this->handlePaymentSucceeded($webhook, $correlationId),
                'payment.failed' => $this->handlePaymentFailed($webhook, $correlationId),
                'payment.refunded' => $this->handlePaymentRefunded($webhook, $correlationId),
                'payment_token.created' => $this->handlePaymentTokenCreated($webhook, $correlationId),
                default => $this->handleUnknownEvent($webhook, $correlationId),
            };

            $webhook->update([
                'status' => \App\Enums\Payments\PaymentWebhookStatus::Processed,
                'processed_at' => now(),
            ]);

            Log::info('CCBillWebhookProcessor: Webhook processed successfully', [
                'correlation_id' => $correlationId,
                'webhook_id' => $webhook->id,
                'event_type' => $eventType,
            ]);
        } catch (\Exception $e) {
            Log::error('CCBillWebhookProcessor: Error processing webhook', [
                'correlation_id' => $correlationId,
                'webhook_id' => $webhook->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $webhook->update([
                'status' => \App\Enums\Payments\PaymentWebhookStatus::Failed,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Map CCBill event name to our internal event type.
     *
     * @param  array<string, mixed>  $payload
     */
    protected function mapEventType(string $event, array $payload): string
    {
        // CCBill event names may vary - adjust based on actual API documentation
        return match (strtolower($event)) {
            'transaction.succeeded', 'payment.succeeded', 'charge.succeeded' => 'payment.succeeded',
            'transaction.failed', 'payment.failed', 'charge.failed' => 'payment.failed',
            'transaction.refunded', 'payment.refunded', 'refund.succeeded' => 'payment.refunded',
            'payment_token.created', 'token.created' => 'payment_token.created',
            default => 'unknown',
        };
    }

    /**
     * Handle payment succeeded event.
     */
    protected function handlePaymentSucceeded(PaymentWebhook $webhook, string $correlationId): void
    {
        $payload = $webhook->payload;
        $transactionId = $payload['transactionId'] ?? $payload['id'] ?? null;

        if (! $transactionId) {
            throw new CCBillApiException('Transaction ID not found in webhook payload');
        }

        // Find payment by provider_payment_id
        $payment = Payment::query()
            ->where('provider', 'ccbill')
            ->where('provider_payment_id', $transactionId)
            ->first();

        if (! $payment) {
            Log::warning('CCBillWebhookProcessor: Payment not found', [
                'correlation_id' => $correlationId,
                'transaction_id' => $transactionId,
            ]);

            return;
        }

        DB::transaction(function () use ($payment, $payload) {
            // Update payment status if needed
            if ($payment->status !== \App\Enums\Payments\PaymentStatus::Captured) {
                $payment->update([
                    'status' => \App\Enums\Payments\PaymentStatus::Captured,
                    'succeeded_at' => now(),
                    'metadata' => array_merge($payment->metadata ?? [], [
                        'webhook_processed' => now()->toIso8601String(),
                        'webhook_payload' => $payload,
                    ]),
                ]);
            }

            // Update payment intent if exists
            $intent = PaymentIntent::query()
                ->where('payment_id', $payment->id)
                ->first();

            if ($intent) {
                $intent->update([
                    'status' => \App\Enums\Payments\PaymentIntentStatus::Succeeded,
                    'metadata' => array_merge($intent->metadata ?? [], [
                        'webhook_processed' => now()->toIso8601String(),
                    ]),
                ]);
            }
        });
    }

    /**
     * Handle payment failed event.
     */
    protected function handlePaymentFailed(PaymentWebhook $webhook, string $correlationId): void
    {
        $payload = $webhook->payload;
        $transactionId = $payload['transactionId'] ?? $payload['id'] ?? null;

        if (! $transactionId) {
            throw new CCBillApiException('Transaction ID not found in webhook payload');
        }

        $payment = Payment::query()
            ->where('provider', 'ccbill')
            ->where('provider_payment_id', $transactionId)
            ->first();

        if (! $payment) {
            Log::warning('CCBillWebhookProcessor: Payment not found for failed event', [
                'correlation_id' => $correlationId,
                'transaction_id' => $transactionId,
            ]);

            return;
        }

        DB::transaction(function () use ($payment, $payload) {
            $payment->update([
                'status' => \App\Enums\Payments\PaymentStatus::Failed,
                'metadata' => array_merge($payment->metadata ?? [], [
                    'webhook_processed' => now()->toIso8601String(),
                    'failure_reason' => $payload['failureReason'] ?? $payload['error'] ?? 'Unknown',
                    'webhook_payload' => $payload,
                ]),
            ]);

            $intent = PaymentIntent::query()
                ->where('payment_id', $payment->id)
                ->first();

            if ($intent) {
                $intent->update([
                    'status' => \App\Enums\Payments\PaymentIntentStatus::Failed,
                    'metadata' => array_merge($intent->metadata ?? [], [
                        'webhook_processed' => now()->toIso8601String(),
                    ]),
                ]);
            }
        });
    }

    /**
     * Handle payment refunded event.
     */
    protected function handlePaymentRefunded(PaymentWebhook $webhook, string $correlationId): void
    {
        $payload = $webhook->payload;
        $transactionId = $payload['transactionId'] ?? $payload['paymentId'] ?? null;
        $refundId = $payload['refundId'] ?? $payload['id'] ?? null;

        if (! $transactionId) {
            throw new CCBillApiException('Transaction ID not found in webhook payload');
        }

        $payment = Payment::query()
            ->where('provider', 'ccbill')
            ->where('provider_payment_id', $transactionId)
            ->first();

        if (! $payment) {
            Log::warning('CCBillWebhookProcessor: Payment not found for refund event', [
                'correlation_id' => $correlationId,
                'transaction_id' => $transactionId,
            ]);

            return;
        }

        DB::transaction(function () use ($payment, $refundId, $payload) {
            $payment->update([
                'status' => \App\Enums\Payments\PaymentStatus::Refunded,
                'refunded_at' => now(),
                'metadata' => array_merge($payment->metadata ?? [], [
                    'webhook_processed' => now()->toIso8601String(),
                    'refund_id' => $refundId,
                    'webhook_payload' => $payload,
                ]),
            ]);

            // Create refund record if needed
            if ($refundId && ! $payment->refunds()->where('provider_refund_id', $refundId)->exists()) {
                $payment->refunds()->create([
                    'amount' => $payload['amount'] ?? $payment->amount,
                    'currency' => $payload['currency'] ?? $payment->currency,
                    'status' => \App\Enums\Payments\PaymentRefundStatus::Succeeded,
                    'provider' => 'ccbill',
                    'provider_refund_id' => $refundId,
                    'metadata' => $payload,
                    'processed_at' => now(),
                ]);
            }
        });
    }

    /**
     * Handle payment token created event (if CCBill sends this).
     */
    protected function handlePaymentTokenCreated(PaymentWebhook $webhook, string $correlationId): void
    {
        // This event might be used to sync token status
        // For now, just log it
        Log::info('CCBillWebhookProcessor: Payment token created event received', [
            'correlation_id' => $correlationId,
            'webhook_id' => $webhook->id,
            'payload' => $webhook->payload,
        ]);
    }

    /**
     * Handle unknown event types.
     */
    protected function handleUnknownEvent(PaymentWebhook $webhook, string $correlationId): void
    {
        Log::warning('CCBillWebhookProcessor: Unknown event type', [
            'correlation_id' => $correlationId,
            'webhook_id' => $webhook->id,
            'event' => $webhook->event,
            'payload' => $webhook->payload,
        ]);
    }

    /**
     * Check if webhook has already been processed (idempotency check).
     */
    protected function isAlreadyProcessed(PaymentWebhook $webhook): bool
    {
        // Check by event ID or transaction ID if available
        $eventId = $webhook->payload['eventId'] ?? $webhook->payload['id'] ?? null;
        $transactionId = $webhook->payload['transactionId'] ?? null;

        if ($eventId) {
            return PaymentWebhook::query()
                ->where('provider', 'ccbill')
                ->where('id', '!=', $webhook->id)
                ->whereJsonContains('payload->eventId', $eventId)
                ->where('status', \App\Enums\Payments\PaymentWebhookStatus::Processed)
                ->exists();
        }

        if ($transactionId) {
            return PaymentWebhook::query()
                ->where('provider', 'ccbill')
                ->where('id', '!=', $webhook->id)
                ->whereJsonContains('payload->transactionId', $transactionId)
                ->where('status', \App\Enums\Payments\PaymentWebhookStatus::Processed)
                ->exists();
        }

        return false;
    }
}

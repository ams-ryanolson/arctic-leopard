<?php

namespace App\Payments\Contracts;

use App\Payments\Data\PaymentCaptureData;
use App\Payments\Data\PaymentIntentData;
use App\Payments\Data\PaymentIntentResponse;
use App\Payments\Data\PaymentRefundData;
use App\Payments\Data\PaymentRefundResponse;
use App\Payments\Data\PaymentResponse;

interface PaymentGatewayContract
{
    /**
     * Unique identifier for the gateway implementation.
     */
    public function identifier(): string;

    /**
     * Create a payment intent for authentication or confirmation workflows.
     */
    public function createIntent(PaymentIntentData $data): PaymentIntentResponse;

    /**
     * Confirm a previously created intent.
     *
     * @param array<string, mixed> $context
     */
    public function confirmIntent(string $providerIntentId, array $context = []): PaymentIntentResponse;

    /**
     * Cancel an intent that has not yet been captured.
     *
     * @param array<string, mixed> $context
     */
    public function cancelIntent(string $providerIntentId, array $context = []): PaymentIntentResponse;

    /**
     * Capture funds for a payment.
     */
    public function capturePayment(PaymentCaptureData $data): PaymentResponse;

    /**
     * Issue a refund for a captured payment.
     */
    public function refundPayment(PaymentRefundData $data): PaymentRefundResponse;
}


<?php

namespace App\Payments\Contracts;

use App\Payments\Data\CardDetails;
use App\Payments\Data\PaymentCaptureData;
use App\Payments\Data\PaymentIntentData;
use App\Payments\Data\PaymentIntentResponse;
use App\Payments\Data\PaymentRefundData;
use App\Payments\Data\PaymentRefundResponse;
use App\Payments\Data\PaymentResponse;
use App\Payments\Data\PaymentTokenData;
use App\Payments\Data\PaymentTokenResponse;

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
     * @param  array<string, mixed>  $context
     */
    public function confirmIntent(string $providerIntentId, array $context = []): PaymentIntentResponse;

    /**
     * Cancel an intent that has not yet been captured.
     *
     * @param  array<string, mixed>  $context
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

    /**
     * Create a payment token from card data (vaulting).
     * Returns token ID and frontend bearer token for widget use.
     */
    public function createPaymentToken(PaymentTokenData $data): PaymentTokenResponse;

    /**
     * Generate a frontend bearer token for CCBill widget initialization.
     * This token is used client-side and should be generated server-side for security.
     */
    public function generateFrontendToken(): string;

    /**
     * Get payment token details including card information.
     * Returns card details (last4, brand, expiration) for display purposes.
     */
    public function getPaymentTokenDetails(string $tokenId): CardDetails;
}

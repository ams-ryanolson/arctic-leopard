<?php

namespace App\Payments\Gateways\CCBill;

use App\Enums\Payments\PaymentType;
use App\Models\Payments\PaymentMethod;
use App\Models\User;
use App\Payments\Contracts\PaymentGatewayContract;
use App\Payments\Contracts\SubscriptionGatewayContract;
use App\Payments\Data\CardDetails;
use App\Payments\Data\PaymentCaptureData;
use App\Payments\Data\PaymentIntentData;
use App\Payments\Data\PaymentIntentResponse;
use App\Payments\Data\PaymentRefundData;
use App\Payments\Data\PaymentRefundResponse;
use App\Payments\Data\PaymentResponse;
use App\Payments\Data\PaymentTokenData;
use App\Payments\Data\PaymentTokenResponse;
use App\Payments\Data\SubscriptionCancelData;
use App\Payments\Data\SubscriptionCreateData;
use App\Payments\Data\SubscriptionResponse;
use App\Payments\Data\SubscriptionResumeData;
use App\Payments\Data\SubscriptionSwapData;
use App\Payments\Exceptions\CCBill3DSFailedException;
use App\Payments\Exceptions\CCBill3DSNotSupportedException;
use App\Payments\Exceptions\PaymentTokenVaultingException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CCBillGateway implements PaymentGatewayContract, SubscriptionGatewayContract
{
    protected CCBillOAuthManager $oauth;

    protected CCBillSubaccountResolver $subaccountResolver;

    protected CCBillHttpClient $httpClient;

    public function __construct(
        protected array $config
    ) {
        $this->oauth = new CCBillOAuthManager($config);
        $this->subaccountResolver = new CCBillSubaccountResolver($config);
        $this->httpClient = new CCBillHttpClient($this->oauth, $config);
    }

    public function identifier(): string
    {
        return 'ccbill';
    }

    /**
     * Create a payment intent.
     * For CCBill, this creates a reference that can be used to charge a payment token later.
     */
    public function createIntent(PaymentIntentData $data): PaymentIntentResponse
    {
        // CCBill doesn't use intents in the traditional sense
        // We create a reference ID that will be used when capturing
        $intentId = 'pi_ccbill_'.Str::random(24);

        return new PaymentIntentResponse(
            provider: $this->identifier(),
            providerIntentId: $intentId,
            status: 'requires_payment_method',
            clientSecret: null,
            raw: [
                'intent_id' => $intentId,
                'amount' => $data->amount->amount(),
                'currency' => $data->amount->currency(),
            ]
        );
    }

    /**
     * Confirm a payment intent.
     * For CCBill, this validates the intent exists but doesn't charge yet.
     */
    public function confirmIntent(string $providerIntentId, array $context = []): PaymentIntentResponse
    {
        return PaymentIntentResponse::fromArray([
            'provider' => $this->identifier(),
            'provider_intent_id' => $providerIntentId,
            'status' => $context['status'] ?? 'requires_capture',
            'raw' => $context,
        ]);
    }

    /**
     * Cancel a payment intent.
     */
    public function cancelIntent(string $providerIntentId, array $context = []): PaymentIntentResponse
    {
        return PaymentIntentResponse::fromArray([
            'provider' => $this->identifier(),
            'provider_intent_id' => $providerIntentId,
            'status' => 'cancelled',
            'raw' => $context,
        ]);
    }

    /**
     * Capture a payment using a stored payment token.
     * The providerIntentId should be the payment token ID from a PaymentMethod.
     */
    public function capturePayment(PaymentCaptureData $data): PaymentResponse
    {
        $correlationId = Str::uuid()->toString();

        Log::info('CCBillGateway: Capturing payment', [
            'correlation_id' => $correlationId,
            'intent_id' => $data->providerIntentId,
            'amount' => $data->amount->amount(),
            'currency' => $data->amount->currency(),
        ]);

        // Get payment method token from metadata or intent ID
        $paymentMethodId = $data->metadata['payment_method_id'] ?? null;
        $tokenId = $data->metadata['payment_token_id'] ?? $data->providerIntentId;

        if ($paymentMethodId) {
            $paymentMethod = PaymentMethod::find($paymentMethodId);
            if ($paymentMethod && $paymentMethod->provider_method_id) {
                $tokenId = $paymentMethod->provider_method_id;
            }
        }

        // Determine subaccount from metadata
        $paymentType = isset($data->metadata['payment_type'])
            ? PaymentType::from($data->metadata['payment_type'])
            : PaymentType::OneTime;

        $isRecurring = $paymentType === PaymentType::Recurring;
        $creatorId = $data->metadata['creator_id'] ?? null;
        $creator = $creatorId ? User::find($creatorId) : null;

        $subaccount = $this->subaccountResolver->resolveSubaccountForCharge(
            $paymentType,
            $isRecurring,
            $creator
        );

        // Calculate initial period (30 days default, or from metadata)
        $initialPeriod = $data->metadata['initial_period'] ?? 30;

        // Charge the token
        $response = $this->httpClient->chargePaymentToken(
            $tokenId,
            $subaccount->clientAccnum,
            $subaccount->clientSubacc,
            $data->amount,
            $initialPeriod
        );

        $transactionId = $response['transactionId'] ?? $response['id'] ?? '';

        return PaymentResponse::fromArray([
            'provider' => $this->identifier(),
            'provider_payment_id' => $transactionId,
            'status' => $this->mapPaymentStatus($response['status'] ?? 'succeeded'),
            'amount' => $data->amount->amount(),
            'currency' => $data->amount->currency(),
            'raw' => $response,
        ]);
    }

    /**
     * Refund a payment.
     */
    public function refundPayment(PaymentRefundData $data): PaymentRefundResponse
    {
        $correlationId = Str::uuid()->toString();

        Log::info('CCBillGateway: Processing refund', [
            'correlation_id' => $correlationId,
            'payment_id' => $data->providerPaymentId,
            'amount' => $data->amount->amount(),
            'currency' => $data->amount->currency(),
        ]);

        $response = $this->httpClient->refundPayment(
            $data->providerPaymentId,
            $data->amount
        );

        $refundId = $response['refundId'] ?? $response['id'] ?? '';

        return PaymentRefundResponse::fromArray([
            'provider' => $this->identifier(),
            'provider_refund_id' => $refundId,
            'status' => $this->mapRefundStatus($response['status'] ?? 'succeeded'),
            'amount' => $data->amount->amount(),
            'currency' => $data->amount->currency(),
            'raw' => $response,
        ]);
    }

    /**
     * Create a payment token (vault a card).
     * Always attempts 3DS first, falls back to non-3DS if not supported, fails if 3DS fails.
     */
    public function createPaymentToken(PaymentTokenData $data): PaymentTokenResponse
    {
        $correlationId = Str::uuid()->toString();

        Log::info('CCBillGateway: Creating payment token', [
            'correlation_id' => $correlationId,
            'user_id' => $data->userId,
        ]);

        // Get vaulting subaccount (always same one)
        $subaccount = $this->subaccountResolver->getVaultingSubaccount();

        // Generate frontend token for widget
        $frontendToken = $this->oauth->generateFrontendToken();

        try {
            // Always attempt 3DS first
            $response = $this->httpClient->createPaymentToken3DS(
                $frontendToken,
                $subaccount->clientAccnum,
                $subaccount->clientSubacc
            );

            Log::info('CCBillGateway: 3DS payment token created successfully', [
                'correlation_id' => $correlationId,
                'token_id' => $response['paymentTokenId'] ?? null,
            ]);

            return new PaymentTokenResponse(
                provider: $this->identifier(),
                providerTokenId: $response['paymentTokenId'],
                frontendBearerToken: $frontendToken,
                clientAccnum: $subaccount->clientAccnum,
                clientSubacc: $subaccount->clientSubacc,
                is3DS: true,
                raw: $response
            );
        } catch (CCBill3DSNotSupportedException $e) {
            // Bank doesn't support 3DS - fallback to non-3DS
            Log::info('CCBillGateway: 3DS not supported, falling back to non-3DS', [
                'correlation_id' => $correlationId,
            ]);

            $response = $this->httpClient->createPaymentToken(
                $frontendToken,
                $subaccount->clientAccnum,
                $subaccount->clientSubacc
            );

            return new PaymentTokenResponse(
                provider: $this->identifier(),
                providerTokenId: $response['paymentTokenId'],
                frontendBearerToken: $frontendToken,
                clientAccnum: $subaccount->clientAccnum,
                clientSubacc: $subaccount->clientSubacc,
                is3DS: false,
                raw: $response
            );
        } catch (CCBill3DSFailedException $e) {
            // 3DS failed (user failed auth) - DO NOT VAULT
            Log::error('CCBillGateway: 3DS authentication failed, not vaulting token', [
                'correlation_id' => $correlationId,
                'error' => $e->getMessage(),
            ]);

            throw new PaymentTokenVaultingException(
                '3DS authentication failed. Card cannot be vaulted.',
                $e->errorCode,
                $e->responseData,
                $e
            );
        }
    }

    /**
     * Generate a frontend bearer token for widget use.
     */
    public function generateFrontendToken(): string
    {
        return $this->oauth->generateFrontendToken();
    }

    /**
     * Get payment token details including card information.
     */
    public function getPaymentTokenDetails(string $tokenId): CardDetails
    {
        $response = $this->httpClient->getPaymentTokenDetails($tokenId);

        // Map CCBill response to CardDetails
        // Adjust field names based on actual CCBill API response structure
        $cardData = $response['card'] ?? $response;

        return CardDetails::fromArray([
            'last_four' => $cardData['lastFour'] ?? $cardData['last_four'] ?? substr($cardData['number'] ?? '', -4),
            'brand' => $this->mapCardBrand($cardData['brand'] ?? $cardData['type'] ?? 'unknown'),
            'exp_month' => str_pad((string) ($cardData['expMonth'] ?? $cardData['exp_month'] ?? ''), 2, '0', STR_PAD_LEFT),
            'exp_year' => (string) ($cardData['expYear'] ?? $cardData['exp_year'] ?? ''),
            'fingerprint' => $cardData['fingerprint'] ?? null,
        ]);
    }

    /**
     * Create a subscription.
     * For CCBill, subscriptions are handled by storing the payment token
     * and charging it manually on renewal dates.
     */
    public function createSubscription(SubscriptionCreateData $data): SubscriptionResponse
    {
        // CCBill doesn't have native subscription support in the way we need
        // We store the payment token and charge it manually
        // This method creates a subscription reference

        $subscriptionId = 'sub_ccbill_'.Str::random(24);

        return SubscriptionResponse::fromArray([
            'provider' => $this->identifier(),
            'provider_subscription_id' => $subscriptionId,
            'status' => 'active',
            'raw' => [
                'subscription_id' => $subscriptionId,
                'payment_method_token' => $data->paymentMethodToken,
                'amount' => $data->amount->amount(),
                'currency' => $data->amount->currency(),
                'interval' => $data->interval,
                'interval_count' => $data->intervalCount,
            ],
        ]);
    }

    /**
     * Swap/update a subscription.
     */
    public function swapSubscription(SubscriptionSwapData $data): SubscriptionResponse
    {
        // For CCBill, we just update the subscription reference
        // Actual charging happens manually

        return SubscriptionResponse::fromArray([
            'provider' => $this->identifier(),
            'provider_subscription_id' => $data->providerSubscriptionId,
            'status' => 'active',
            'raw' => [
                'subscription_id' => $data->providerSubscriptionId,
                'amount' => $data->amount->amount(),
                'currency' => $data->amount->currency(),
                'interval' => $data->interval,
                'interval_count' => $data->intervalCount,
            ],
        ]);
    }

    /**
     * Cancel a subscription.
     */
    public function cancelSubscription(SubscriptionCancelData $data): SubscriptionResponse
    {
        // For CCBill, cancellation is handled in our system
        // We stop charging the token manually

        return SubscriptionResponse::fromArray([
            'provider' => $this->identifier(),
            'provider_subscription_id' => $data->providerSubscriptionId,
            'status' => $data->immediate ? 'cancelled' : 'active',
            'raw' => [
                'subscription_id' => $data->providerSubscriptionId,
                'immediate' => $data->immediate,
                'reason' => $data->reason,
            ],
        ]);
    }

    /**
     * Resume a cancelled subscription.
     */
    public function resumeSubscription(SubscriptionResumeData $data): SubscriptionResponse
    {
        // For CCBill, resumption is handled in our system
        // We resume charging the token manually

        return SubscriptionResponse::fromArray([
            'provider' => $this->identifier(),
            'provider_subscription_id' => $data->providerSubscriptionId,
            'status' => 'active',
            'raw' => [
                'subscription_id' => $data->providerSubscriptionId,
                'payment_method_token' => $data->paymentMethodToken,
            ],
        ]);
    }

    /**
     * Map CCBill payment status to our status format.
     */
    protected function mapPaymentStatus(string $status): string
    {
        return match (strtolower($status)) {
            'succeeded', 'completed', 'approved' => 'captured',
            'pending', 'processing' => 'pending',
            'failed', 'declined', 'rejected' => 'failed',
            'refunded' => 'refunded',
            'cancelled', 'canceled' => 'cancelled',
            default => 'pending',
        };
    }

    /**
     * Map CCBill refund status to our status format.
     */
    protected function mapRefundStatus(string $status): string
    {
        return match (strtolower($status)) {
            'succeeded', 'completed', 'approved' => 'succeeded',
            'pending', 'processing' => 'processing',
            'failed', 'declined', 'rejected' => 'failed',
            default => 'pending',
        };
    }

    /**
     * Map CCBill card brand to our brand format.
     */
    protected function mapCardBrand(string $brand): string
    {
        $normalized = strtolower($brand);

        return match ($normalized) {
            'visa' => 'visa',
            'mastercard', 'master' => 'mastercard',
            'amex', 'american express' => 'amex',
            'discover' => 'discover',
            'jcb' => 'jcb',
            'diners', 'diners club' => 'diners',
            default => 'unknown',
        };
    }
}

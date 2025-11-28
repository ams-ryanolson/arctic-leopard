<?php

namespace App\Services\Payments;

use App\Models\Payments\PaymentMethod;
use App\Models\User;
use App\Payments\Data\CardDetails;
use App\Payments\PaymentGatewayManager;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentMethodService
{
    public function __construct(
        protected PaymentGatewayManager $gateways
    ) {}

    /**
     * Vault a payment token and store it as a payment method.
     *
     * @param  CardDetails|null  $cardDetails  Card details if already known, otherwise fetched from gateway
     */
    public function vaultToken(
        User $user,
        string $providerTokenId,
        string $gateway,
        ?CardDetails $cardDetails = null
    ): PaymentMethod {
        return DB::transaction(function () use ($user, $providerTokenId, $gateway, $cardDetails) {
            // Fetch card details from gateway if not provided
            if ($cardDetails === null) {
                $cardDetails = $this->fetchCardDetailsFromGateway($providerTokenId, $gateway);
            }

            // Check if this token already exists for this user
            $existing = PaymentMethod::query()
                ->where('user_id', $user->id)
                ->where('provider', $gateway)
                ->where('provider_method_id', $providerTokenId)
                ->first();

            if ($existing) {
                Log::info('PaymentMethodService: Payment token already vaulted', [
                    'user_id' => $user->id,
                    'payment_method_id' => $existing->id,
                    'provider_token_id' => $this->sanitizeTokenId($providerTokenId),
                ]);

                return $existing;
            }

            // Create new payment method
            $paymentMethod = PaymentMethod::create([
                'user_id' => $user->id,
                'provider' => $gateway,
                'provider_method_id' => $providerTokenId,
                'type' => 'card',
                'brand' => $cardDetails->brand,
                'last_four' => $cardDetails->lastFour,
                'exp_month' => $cardDetails->expMonth,
                'exp_year' => $cardDetails->expYear,
                'fingerprint' => $cardDetails->fingerprint,
                'status' => \App\Enums\Payments\PaymentMethodStatus::Active,
                'metadata' => [
                    'gateway' => $gateway,
                    'vaulted_at' => now()->toIso8601String(),
                ],
            ]);

            // Set as default if user has no other payment methods
            $hasOtherMethods = PaymentMethod::query()
                ->where('user_id', $user->id)
                ->where('id', '!=', $paymentMethod->id)
                ->active()
                ->exists();

            if (! $hasOtherMethods) {
                $paymentMethod->update(['is_default' => true]);
            }

            Log::info('PaymentMethodService: Payment token vaulted successfully', [
                'user_id' => $user->id,
                'payment_method_id' => $paymentMethod->id,
                'provider_token_id' => $this->sanitizeTokenId($providerTokenId),
            ]);

            return $paymentMethod;
        });
    }

    /**
     * Get all active payment methods for a user.
     *
     * @return Collection<int, PaymentMethod>
     */
    public function getUserPaymentMethods(User $user): Collection
    {
        return PaymentMethod::query()
            ->where('user_id', $user->id)
            ->active()
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get the default payment method for a user.
     */
    public function getDefaultPaymentMethod(User $user): ?PaymentMethod
    {
        return PaymentMethod::query()
            ->where('user_id', $user->id)
            ->active()
            ->where('is_default', true)
            ->first();
    }

    /**
     * Set a payment method as the default for a user.
     */
    public function setDefaultPaymentMethod(User $user, PaymentMethod $paymentMethod): void
    {
        // Verify ownership
        if ($paymentMethod->user_id !== $user->id) {
            throw new \InvalidArgumentException('Payment method does not belong to user.');
        }

        DB::transaction(function () use ($user, $paymentMethod) {
            // Unset all other default methods
            PaymentMethod::query()
                ->where('user_id', $user->id)
                ->where('id', '!=', $paymentMethod->id)
                ->update(['is_default' => false]);

            // Set this one as default
            $paymentMethod->update(['is_default' => true]);

            Log::info('PaymentMethodService: Default payment method updated', [
                'user_id' => $user->id,
                'payment_method_id' => $paymentMethod->id,
            ]);
        });
    }

    /**
     * Delete a payment method (soft delete).
     */
    public function deletePaymentMethod(PaymentMethod $paymentMethod): void
    {
        DB::transaction(function () use ($paymentMethod) {
            $wasDefault = $paymentMethod->is_default;
            $userId = $paymentMethod->user_id;

            // Soft delete
            $paymentMethod->delete();

            // If it was the default, set another one as default
            if ($wasDefault) {
                $newDefault = PaymentMethod::query()
                    ->where('user_id', $userId)
                    ->active()
                    ->first();

                if ($newDefault) {
                    $newDefault->update(['is_default' => true]);
                }
            }

            Log::info('PaymentMethodService: Payment method deleted', [
                'user_id' => $userId,
                'payment_method_id' => $paymentMethod->id,
                'was_default' => $wasDefault,
            ]);
        });
    }

    /**
     * Fetch card details from the gateway API.
     */
    protected function fetchCardDetailsFromGateway(string $tokenId, string $gateway): CardDetails
    {
        $gatewayDriver = $this->gateways->driver($gateway);

        if (! method_exists($gatewayDriver, 'getPaymentTokenDetails')) {
            throw new \RuntimeException("Gateway [{$gateway}] does not support fetching token details.");
        }

        return $gatewayDriver->getPaymentTokenDetails($tokenId);
    }

    /**
     * Sanitize token ID for logging (show only last 4 characters).
     */
    protected function sanitizeTokenId(string $tokenId): string
    {
        if (strlen($tokenId) <= 4) {
            return '****';
        }

        return '****'.substr($tokenId, -4);
    }
}

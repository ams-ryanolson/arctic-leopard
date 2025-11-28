<?php

namespace App\Payments\Gateways\CCBill;

use App\Enums\Payments\PaymentType;
use App\Models\User;
use App\Payments\Data\SubaccountConfig;
use InvalidArgumentException;

class CCBillSubaccountResolver
{
    public function __construct(
        protected array $config
    ) {}

    /**
     * Get the subaccount configuration for vaulting payment tokens.
     * Always uses the same subaccount (low_risk_non_recurring) for vaulting.
     */
    public function getVaultingSubaccount(): SubaccountConfig
    {
        $lowRiskConfig = $this->config['low_risk_non_recurring'] ?? [];

        if (empty($lowRiskConfig['client_accnum']) || empty($lowRiskConfig['client_subacc'])) {
            throw new InvalidArgumentException('Low risk non-recurring subaccount configuration is missing.');
        }

        return new SubaccountConfig(
            clientAccnum: (int) $lowRiskConfig['client_accnum'],
            clientSubacc: (int) $lowRiskConfig['client_subacc']
        );
    }

    /**
     * Resolve the subaccount configuration for charging a payment.
     *
     * @param  PaymentType  $paymentType  The type of payment (one_time, recurring, etc.)
     * @param  bool  $isRecurring  Whether this is a recurring payment
     * @param  User|null  $creator  The creator user (null for site subscriptions)
     */
    public function resolveSubaccountForCharge(
        PaymentType $paymentType,
        bool $isRecurring,
        ?User $creator = null
    ): SubaccountConfig {
        // Tips & Wishlist: Low Risk Non-Recurring
        if (in_array($paymentType, [PaymentType::OneTime], true)) {
            // Check metadata to determine if it's a tip or wishlist
            // For now, we'll use low risk for all one-time payments
            // This can be refined based on metadata in the future
            return $this->getLowRiskNonRecurring();
        }

        // Site Subscriptions (no creator): Low Risk Non-Recurring
        if ($paymentType === PaymentType::Recurring && $creator === null) {
            return $this->getLowRiskNonRecurring();
        }

        // Creator Subscriptions & Paywalls: High Risk Non-Recurring
        if ($paymentType === PaymentType::Recurring && $creator !== null) {
            return $this->getHighRiskNonRecurring();
        }

        // Default to high risk for safety
        return $this->getHighRiskNonRecurring();
    }

    /**
     * Get low risk non-recurring subaccount configuration.
     */
    protected function getLowRiskNonRecurring(): SubaccountConfig
    {
        $config = $this->config['low_risk_non_recurring'] ?? [];

        if (empty($config['client_accnum']) || empty($config['client_subacc'])) {
            throw new InvalidArgumentException('Low risk non-recurring subaccount configuration is missing.');
        }

        return new SubaccountConfig(
            clientAccnum: (int) $config['client_accnum'],
            clientSubacc: (int) $config['client_subacc']
        );
    }

    /**
     * Get high risk non-recurring subaccount configuration.
     */
    protected function getHighRiskNonRecurring(): SubaccountConfig
    {
        $config = $this->config['high_risk_non_recurring'] ?? [];

        if (empty($config['client_accnum']) || empty($config['client_subacc'])) {
            throw new InvalidArgumentException('High risk non-recurring subaccount configuration is missing.');
        }

        return new SubaccountConfig(
            clientAccnum: (int) $config['client_accnum'],
            clientSubacc: (int) $config['client_subacc']
        );
    }
}

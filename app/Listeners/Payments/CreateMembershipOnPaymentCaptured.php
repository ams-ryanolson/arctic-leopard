<?php

namespace App\Listeners\Payments;

use App\Events\Payments\PaymentCaptured;
use App\Models\Memberships\MembershipPlan;
use App\Models\Memberships\UserMembership;
use App\Services\Memberships\MembershipDiscountService;
use App\Services\Memberships\MembershipService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class CreateMembershipOnPaymentCaptured implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        private readonly MembershipService $membershipService,
        private readonly MembershipDiscountService $discountService
    ) {}

    public function handle(PaymentCaptured $event): void
    {
        $payment = $event->payment;
        $payable = $payment->payable;

        if (! $payable instanceof MembershipPlan) {
            return;
        }

        $metadata = $payment->metadata ?? [];
        $billingType = $metadata['billing_type'] ?? 'one_time';
        $isUpgrade = $metadata['is_upgrade'] ?? false;
        $discountCode = $metadata['discount_code'] ?? null;
        $discountAmount = $metadata['discount_amount'] ?? 0;

        // Record discount usage if applicable
        if ($discountCode !== null) {
            $discount = $this->discountService->validateCode($discountCode, $payable);
            if ($discount !== null) {
                $this->discountService->recordUsage($discount);
            }
        }

        if ($isUpgrade && isset($metadata['current_membership_id'])) {
            $currentMembership = UserMembership::find($metadata['current_membership_id']);

            if ($currentMembership !== null) {
                $this->membershipService->upgrade(
                    $payment->payer,
                    $currentMembership,
                    $payable,
                    $payment,
                    $billingType,
                    $discountAmount
                );

                return;
            }
        }

        // Regular purchase
        $this->membershipService->purchase(
            $payment->payer,
            $payable,
            $payment,
            $billingType,
            $discountAmount
        );
    }
}

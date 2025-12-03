<?php

namespace App\Listeners\Payments;

use App\Events\Payments\PaymentCaptured;
use App\Models\Memberships\MembershipPlan;
use App\Models\Memberships\UserMembership;
use App\Notifications\MembershipPurchased;
use App\Notifications\Memberships\MembershipGiftedNotification;
use App\Notifications\Memberships\MembershipGiftSentNotification;
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
        $isGift = $metadata['is_gift'] ?? false;
        $discountCode = $metadata['discount_code'] ?? null;
        $discountAmount = $metadata['discount_amount'] ?? 0;

        // Record discount usage if applicable
        if ($discountCode !== null) {
            $discount = $this->discountService->validateCode($discountCode, $payable);
            if ($discount !== null) {
                $this->discountService->recordUsage($discount);
            }
        }

        $membership = null;

        // Handle gift memberships
        if ($isGift && $payment->payee_id !== null) {
            $recipient = $payment->payee;
            $gifter = $payment->payer;

            if ($recipient && $gifter) {
                $membership = $this->membershipService->gift(
                    $recipient,
                    $gifter,
                    $payable,
                    $payment,
                    $discountAmount
                );

                if ($membership) {
                    // Notify the recipient about their gift (using proper gift notification)
                    $recipient->notify(new MembershipGiftedNotification($gifter, $membership));

                    // Notify the gifter that their gift was sent successfully
                    $gifter->notify(new MembershipGiftSentNotification($recipient, $membership));
                }

                return;
            }
        }

        if ($isUpgrade && isset($metadata['current_membership_id'])) {
            $currentMembership = UserMembership::find($metadata['current_membership_id']);

            if ($currentMembership !== null) {
                $membership = $this->membershipService->upgrade(
                    $payment->payer,
                    $currentMembership,
                    $payable,
                    $payment,
                    $billingType,
                    $discountAmount
                );

                // Notify user about their upgrade
                if ($membership) {
                    $payment->payer->notify(new MembershipPurchased($membership));
                }

                return;
            }
        }

        // Regular purchase
        $membership = $this->membershipService->purchase(
            $payment->payer,
            $payable,
            $payment,
            $billingType,
            $discountAmount
        );

        // Notify user about their new membership
        if ($membership) {
            $payment->payer->notify(new MembershipPurchased($membership));
        }
    }
}

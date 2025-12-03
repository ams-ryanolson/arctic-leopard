<?php

namespace App\Listeners\Payments;

use App\Events\Payments\PaymentRefunded;
use App\Models\Memberships\UserMembership;
use App\Services\Memberships\MembershipService;
use App\Services\Toasts\ToastBus;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class RevokeGiftMembershipOnChargeback implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        private readonly MembershipService $membershipService,
        private readonly ToastBus $toasts
    ) {}

    public function handle(PaymentRefunded $event): void
    {
        $payment = $event->payment;
        $metadata = $payment->metadata ?? [];

        // Check if this is a gift membership payment
        if (! ($metadata['is_gift'] ?? false)) {
            return;
        }

        $giftedToUserId = $metadata['gifted_to_user_id'] ?? $payment->payee_id;
        $giftedByUserId = $metadata['gifted_by_user_id'] ?? $payment->payer_id;

        if (! $giftedToUserId) {
            return;
        }

        // Find the gift membership
        $membership = UserMembership::query()
            ->where('user_id', $giftedToUserId)
            ->where('gifted_by_user_id', $giftedByUserId)
            ->where('payment_id', $payment->id)
            ->where('status', 'active')
            ->first();

        if (! $membership) {
            Log::warning('RevokeGiftMembershipOnChargeback: Gift membership not found', [
                'payment_id' => $payment->id,
                'gifted_to_user_id' => $giftedToUserId,
                'gifted_by_user_id' => $giftedByUserId,
            ]);

            return;
        }

        // Cancel/expire the membership
        $this->membershipService->cancel($membership, 'chargeback_refund');

        // Notify recipient
        $recipient = $membership->user;
        if ($recipient) {
            $this->toasts->warning(
                $recipient,
                'Your gift membership was revoked due to a payment issue. Please contact support if you have questions.',
                [
                    'category' => 'membership',
                    'meta' => [
                        'membership_id' => $membership->id,
                        'reason' => 'chargeback',
                    ],
                ]
            );
        }

        // Notify gifter
        $gifter = $payment->payer;
        if ($gifter) {
            $this->toasts->warning(
                $gifter,
                'Your gift payment was refunded. The membership has been revoked from the recipient.',
                [
                    'category' => 'membership',
                    'meta' => [
                        'payment_id' => $payment->id,
                        'reason' => 'chargeback',
                    ],
                ]
            );
        }

        // Log for audit trail
        Log::info('RevokeGiftMembershipOnChargeback: Gift membership revoked due to chargeback', [
            'payment_id' => $payment->id,
            'membership_id' => $membership->id,
            'gifted_to_user_id' => $giftedToUserId,
            'gifted_by_user_id' => $giftedByUserId,
        ]);
    }
}

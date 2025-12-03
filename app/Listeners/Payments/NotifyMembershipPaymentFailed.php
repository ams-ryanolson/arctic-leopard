<?php

namespace App\Listeners\Payments;

use App\Events\Payments\PaymentFailed;
use App\Models\Memberships\MembershipPlan;
use App\Notifications\MembershipPurchaseFailed;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class NotifyMembershipPaymentFailed implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PaymentFailed $event): void
    {
        $payment = $event->payment;
        $payable = $payment->payable;

        // Only handle membership plan payments
        if (! $payable instanceof MembershipPlan) {
            return;
        }

        $payer = $payment->payer;

        if (! $payer) {
            return;
        }

        // Get failure reason from payment metadata or raw response
        $metadata = $payment->metadata ?? [];
        $reason = $metadata['failure_reason']
            ?? $metadata['decline_text']
            ?? $metadata['error_message']
            ?? 'Payment could not be processed';

        $declineCode = $metadata['decline_code'] ?? null;

        $payer->notify(new MembershipPurchaseFailed(
            $payable,
            $reason,
            $payment->amount,
            $declineCode
        ));
    }
}

<?php

namespace App\Listeners\Payments;

use App\Enums\Payments\PostPurchaseStatus;
use App\Events\Payments\PaymentRefunded;
use App\Models\PostPurchase;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class RefundPostPurchaseOnPaymentRefunded implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PaymentRefunded $event): void
    {
        $purchase = $event->payment->payable;

        if (! $purchase instanceof PostPurchase) {
            return;
        }

        $purchase->forceFill([
            'status' => PostPurchaseStatus::Refunded,
        ])->save();
    }
}


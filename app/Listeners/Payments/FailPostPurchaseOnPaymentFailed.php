<?php

namespace App\Listeners\Payments;

use App\Enums\Payments\PostPurchaseStatus;
use App\Events\Payments\PaymentFailed;
use App\Models\PostPurchase;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class FailPostPurchaseOnPaymentFailed implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PaymentFailed $event): void
    {
        $purchase = $event->payment->payable;

        if (! $purchase instanceof PostPurchase) {
            return;
        }

        $purchase->forceFill([
            'status' => PostPurchaseStatus::Failed,
        ])->save();
    }
}


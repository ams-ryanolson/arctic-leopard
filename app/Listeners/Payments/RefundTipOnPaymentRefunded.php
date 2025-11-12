<?php

namespace App\Listeners\Payments;

use App\Enums\Payments\TipStatus;
use App\Events\Payments\PaymentRefunded;
use App\Models\Payments\Tip;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class RefundTipOnPaymentRefunded implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PaymentRefunded $event): void
    {
        $tip = $event->payment->payable;

        if (! $tip instanceof Tip) {
            return;
        }

        $tip->forceFill([
            'status' => TipStatus::Refunded,
        ])->save();
    }
}


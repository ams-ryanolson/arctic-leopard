<?php

namespace App\Listeners\Payments;

use App\Enums\Payments\TipStatus;
use App\Events\Payments\PaymentCaptured;
use App\Models\Payments\Tip;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class CompleteTipOnPaymentCaptured implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PaymentCaptured $event): void
    {
        $tip = $event->payment->payable;

        if (! $tip instanceof Tip) {
            return;
        }

        $tip->forceFill([
            'status' => TipStatus::Completed,
            'payment_id' => $event->payment->id,
        ])->save();
    }
}

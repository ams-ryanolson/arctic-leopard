<?php

namespace App\Listeners\Payments;

use App\Enums\Payments\TipStatus;
use App\Events\Payments\PaymentFailed;
use App\Models\Payments\Tip;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class FailTipOnPaymentFailed implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PaymentFailed $event): void
    {
        $tip = $event->payment->payable;

        if (! $tip instanceof Tip) {
            return;
        }

        $tip->forceFill([
            'status' => TipStatus::Failed,
        ])->save();
    }
}


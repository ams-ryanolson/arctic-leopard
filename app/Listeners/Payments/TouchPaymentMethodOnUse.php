<?php

namespace App\Listeners\Payments;

use App\Events\Payments\PaymentCaptured;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class TouchPaymentMethodOnUse implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PaymentCaptured $event): void
    {
        $method = $event->payment->paymentMethod;

        if (! $method) {
            return;
        }

        $method->forceFill([
            'last_used_at' => now(),
        ])->save();
    }
}

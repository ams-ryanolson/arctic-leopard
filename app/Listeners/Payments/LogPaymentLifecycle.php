<?php

namespace App\Listeners\Payments;

use App\Events\Payments\PaymentEvent;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class LogPaymentLifecycle implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PaymentEvent $event): void
    {
        $payload = $event->payload();

        Log::info('payment.lifecycle', $payload);

        $payment = $event->payment;

        activity('payments')
            ->performedOn($payment)
            ->causedBy($payment->payer ?? null)
            ->event(class_basename($event))
            ->withProperties($payload)
            ->log(sprintf('Payment %s transitioned to %s', $payment->uuid, $payment->status->value));
    }
}

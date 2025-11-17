<?php

namespace App\Listeners\Payments;

use App\Events\Payments\PaymentIntentEvent;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class LogPaymentIntentLifecycle implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PaymentIntentEvent $event): void
    {
        $payload = $event->payload();

        Log::info('payment_intent.lifecycle', $payload);

        $intent = $event->intent;

        activity('payment_intents')
            ->performedOn($intent)
            ->causedBy($intent->payer ?? null)
            ->event(class_basename($event))
            ->withProperties($payload)
            ->log(sprintf('Payment intent %s transitioned to %s', $intent->uuid, $intent->status->value));
    }
}

<?php

namespace App\Listeners\Payments;

use App\Events\Payments\SubscriptionEvent;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class LogSubscriptionLifecycle implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(SubscriptionEvent $event): void
    {
        $payload = $event->payload();

        Log::info('subscription.lifecycle', $payload);

        $subscription = $event->subscription;

        activity('subscriptions')
            ->performedOn($subscription)
            ->causedBy($subscription->subscriber ?? null)
            ->event(class_basename($event))
            ->withProperties($payload)
            ->log(sprintf(
                'Subscription %s transitioned to %s',
                $subscription->uuid,
                $subscription->status->value
            ));
    }
}


<?php

namespace App\Listeners\Payments;

use App\Enums\Payments\PostPurchaseStatus;
use App\Events\Payments\PaymentCaptured;
use App\Models\PostPurchase;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use App\Services\Posts\PostLockService;

class CompletePostPurchaseOnPaymentCaptured implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        protected readonly PostLockService $locks
    ) {
    }

    public function handle(PaymentCaptured $event): void
    {
        $purchase = $event->payment->payable;

        if (! $purchase instanceof PostPurchase) {
            return;
        }

        $purchase->forceFill([
            'status' => PostPurchaseStatus::Completed,
            'payment_id' => $event->payment->id,
            'fulfilled_at' => now(),
        ])->save();

        $this->locks->completePurchase($purchase);
    }
}


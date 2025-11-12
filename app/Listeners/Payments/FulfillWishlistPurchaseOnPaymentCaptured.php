<?php

namespace App\Listeners\Payments;

use App\Enums\Payments\WishlistPurchaseStatus;
use App\Events\Payments\PaymentCaptured;
use App\Models\Wishlists\WishlistPurchase;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class FulfillWishlistPurchaseOnPaymentCaptured implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PaymentCaptured $event): void
    {
        $purchase = $event->payment->payable;

        if (! $purchase instanceof WishlistPurchase) {
            return;
        }

        $purchase->forceFill([
            'status' => WishlistPurchaseStatus::Completed,
            'payment_id' => $event->payment->id,
            'fulfilled_at' => now(),
        ])->save();
    }
}


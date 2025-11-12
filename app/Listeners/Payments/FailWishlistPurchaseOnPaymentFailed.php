<?php

namespace App\Listeners\Payments;

use App\Enums\Payments\WishlistPurchaseStatus;
use App\Events\Payments\PaymentFailed;
use App\Models\Wishlists\WishlistPurchase;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class FailWishlistPurchaseOnPaymentFailed implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(PaymentFailed $event): void
    {
        $purchase = $event->payment->payable;

        if (! $purchase instanceof WishlistPurchase) {
            return;
        }

        $purchase->forceFill([
            'status' => WishlistPurchaseStatus::Failed,
        ])->save();
    }
}


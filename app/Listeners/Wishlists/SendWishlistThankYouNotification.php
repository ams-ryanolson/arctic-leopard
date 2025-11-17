<?php

namespace App\Listeners\Wishlists;

use App\Events\Wishlists\WishlistPurchaseCompleted;
use App\Notifications\Wishlists\WishlistThankYouNotification;

class SendWishlistThankYouNotification
{
    /**
     * Handle the event.
     */
    public function handle(WishlistPurchaseCompleted $event): void
    {
        $purchase = $event->purchase->loadMissing(['item.creator', 'buyer']);
        $item = $purchase->item;
        $buyer = $purchase->buyer;

        if ($buyer === null || $item->creator === null) {
            return;
        }

        // Don't notify if buyer is the creator
        if ($buyer->is($item->creator)) {
            return;
        }

        // Don't notify if blocked
        if ($buyer->hasBlockRelationshipWith($item->creator)) {
            return;
        }

        $buyer->notify(new WishlistThankYouNotification($purchase, $item));
    }
}

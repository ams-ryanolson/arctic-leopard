<?php

namespace App\Notifications\Wishlists;

use App\Models\Wishlists\WishlistItem;
use App\Models\Wishlists\WishlistPurchase;
use App\Notifications\DatabaseNotification;

class WishlistThankYouNotification extends DatabaseNotification
{
    public function __construct(
        public WishlistPurchase $purchase,
        public WishlistItem $item,
    ) {
        parent::__construct($item->creator);
    }

    public function databaseType(object $notifiable): string
    {
        return 'wishlist.thank-you';
    }

    protected function subjectPayload(object $notifiable): array
    {
        return [
            'wishlist_purchase_id' => $this->purchase->getKey(),
            'wishlist_item_id' => $this->item->getKey(),
            'item_title' => $this->item->title,
            'amount' => $this->purchase->amount,
            'currency' => $this->purchase->currency,
            'message' => $this->purchase->message,
        ];
    }

    protected function metaPayload(object $notifiable): array
    {
        $buyer = $this->purchase->buyer;

        return [
            'buyer_name' => $buyer->display_name ?? $buyer->username,
            'buyer_avatar' => $buyer->avatar_url,
            'formatted_amount' => number_format($this->purchase->amount / 100, 2).' '.$this->purchase->currency,
        ];
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }
}

<?php

namespace App\Events\Wishlists;

use App\Models\Wishlists\WishlistPurchase;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WishlistPurchaseCompleted
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public WishlistPurchase $purchase,
    ) {}
}

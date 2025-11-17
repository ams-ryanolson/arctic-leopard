<?php

namespace App\Listeners\Wishlists;

use App\Events\Wishlists\WishlistPurchaseCompleted;
use App\Services\Payments\WishlistService;

class UpdateWishlistItemStatus
{
    public function __construct(
        private readonly WishlistService $wishlistService,
    ) {}

    /**
     * Handle the event.
     */
    public function handle(WishlistPurchaseCompleted $event): void
    {
        $this->wishlistService->handleCompletedPurchase($event->purchase);
    }
}

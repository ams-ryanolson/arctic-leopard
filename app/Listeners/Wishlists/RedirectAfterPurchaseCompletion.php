<?php

namespace App\Listeners\Wishlists;

use App\Events\Wishlists\WishlistPurchaseCompleted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class RedirectAfterPurchaseCompletion implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(WishlistPurchaseCompleted $event): void
    {
        // This listener can be used to send notifications or perform other actions
        // The actual redirect happens client-side after payment confirmation
        // Payment gateways typically handle redirects via return URLs
    }
}

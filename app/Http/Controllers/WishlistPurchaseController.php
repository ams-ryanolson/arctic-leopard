<?php

namespace App\Http\Controllers;

use App\Http\Resources\Wishlists\WishlistPurchaseResource;
use App\Models\Wishlists\WishlistPurchase;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class WishlistPurchaseController extends Controller
{
    /**
     * Display success page after successful purchase.
     */
    public function success(Request $request, WishlistPurchase $purchase): InertiaResponse
    {
        // Verify the purchase belongs to the authenticated user
        if ($request->user()->getKey() !== $purchase->buyer_id) {
            abort(403, 'You do not have permission to view this purchase.');
        }

        $purchase->load(['item.creator', 'payment']);

        return Inertia::render('Wishlist/Success', [
            'purchase' => (new WishlistPurchaseResource($purchase))->toArray($request),
        ]);
    }

    /**
     * Display failure page after failed purchase.
     */
    public function failure(Request $request, WishlistPurchase $purchase): InertiaResponse
    {
        // Verify the purchase belongs to the authenticated user
        if ($request->user()->getKey() !== $purchase->buyer_id) {
            abort(403, 'You do not have permission to view this purchase.');
        }

        $purchase->load(['item.creator']);

        $errorMessage = 'Your payment could not be processed. Please try again or use a different payment method.';

        return Inertia::render('Wishlist/Failure', [
            'purchase' => [
                'id' => $purchase->id,
                'uuid' => $purchase->uuid,
                'item' => [
                    'id' => $purchase->item->id,
                    'title' => $purchase->item->title,
                    'creator' => [
                        'username' => $purchase->item->creator->username,
                    ],
                ],
            ],
            'error' => $errorMessage,
            'message' => $errorMessage,
        ]);
    }
}

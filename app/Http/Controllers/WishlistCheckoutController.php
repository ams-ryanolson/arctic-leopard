<?php

namespace App\Http\Controllers;

use App\Http\Requests\Wishlist\PurchaseWishlistItemRequest;
use App\Http\Resources\Wishlists\WishlistItemResource;
use App\Models\Wishlists\WishlistItem;
use App\Payments\Data\WishlistPurchaseData;
use App\Services\Payments\WishlistService;
use App\ValueObjects\Money;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class WishlistCheckoutController extends Controller
{
    public function __construct(
        private readonly WishlistService $wishlistService,
    ) {}

    /**
     * Display checkout page for item.
     */
    public function show(Request $request, WishlistItem $wishlistItem): InertiaResponse
    {
        $wishlistItem->load(['creator']);

        if (! $wishlistItem->canBePurchased()) {
            abort(404, 'This wishlist item is no longer available.');
        }

        $feePercent = (float) \App\Models\AdminSetting::get('wishlist_platform_fee_percent', 10.0);

        $resource = new WishlistItemResource($wishlistItem);

        return Inertia::render('Wishlist/Checkout', [
            'item' => $resource->toArray($request),
            'fee_percent' => $feePercent,
            'minimum_contribution' => 500, // $5.00 in cents
        ]);
    }

    /**
     * Process purchase/contribution.
     */
    public function store(PurchaseWishlistItemRequest $request, WishlistItem $wishlistItem): JsonResponse|RedirectResponse
    {
        $user = $request->user();

        if (! $wishlistItem->canBePurchased()) {
            return response()->json([
                'message' => 'This wishlist item is no longer available.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $validated = $request->validated();
        $amount = Money::from($validated['amount'], $validated['currency']);

        $purchaseData = new WishlistPurchaseData(
            wishlistItemId: $wishlistItem->getKey(),
            buyerId: $user->getKey(),
            creatorId: $wishlistItem->creator_id,
            amount: $amount,
            message: $validated['message'] ?? null,
            metadata: [],
            method: $validated['method'] ?? null,
            coversFee: $validated['covers_fee'] ?? false
        );

        $result = $this->wishlistService->initiatePurchase($purchaseData, $validated['gateway'] ?? null);

        if ($request->wantsJson()) {
            return response()->json([
                'purchase' => $result['purchase'],
                'intent' => $result['intent'],
            ], Response::HTTP_CREATED);
        }

        // Redirect to payment confirmation or return URL
        return redirect()
            ->route('signals.wishlist.index')
            ->with('success', 'Purchase initiated successfully.');
    }
}

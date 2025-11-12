<?php

namespace App\Services\Payments;

use App\Enums\Payments\PaymentType;
use App\Enums\Payments\WishlistPurchaseStatus;
use App\Models\Wishlists\WishlistItem;
use App\Models\Wishlists\WishlistPurchase;
use App\Payments\Data\PaymentIntentData;
use App\Payments\Data\WishlistPurchaseData;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

class WishlistService
{
    public function __construct(
        protected readonly PaymentService $payments
    ) {
    }

    /**
     * Initiate a wishlist purchase and payment intent.
     *
     * @return array{purchase: WishlistPurchase, intent: \App\Models\Payments\PaymentIntent}
     *
     * @throws ModelNotFoundException
     */
    public function initiatePurchase(WishlistPurchaseData $data, ?string $gateway = null): array
    {
        $item = WishlistItem::query()->whereKey($data->wishlistItemId)->firstOrFail();

        $amount = $data->amount;

        return DB::transaction(function () use ($item, $data, $amount, $gateway) {
            $purchase = WishlistPurchase::query()->create([
                'wishlist_item_id' => $item->getKey(),
                'buyer_id' => $data->buyerId,
                'amount' => $amount->amount(),
                'currency' => $amount->currency(),
                'status' => WishlistPurchaseStatus::Pending,
                'message' => $data->message,
                'metadata' => $data->metadata,
            ]);

            $intentData = new PaymentIntentData(
                payableType: WishlistPurchase::class,
                payableId: $purchase->getKey(),
                amount: $amount,
                payerId: $data->buyerId,
                payeeId: $data->creatorId,
                type: PaymentType::OneTime,
                method: $data->method,
                metadata: $data->metadata,
                description: $data->message
            );

            $intent = $this->payments->createIntent($intentData, $gateway);

            $purchase->payment_id = $intent->payment_id;
            $purchase->save();

            return [
                'purchase' => $purchase->fresh(),
                'intent' => $intent,
            ];
        });
    }
}


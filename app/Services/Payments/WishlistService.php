<?php

namespace App\Services\Payments;

use App\Enums\Payments\PaymentType;
use App\Enums\Payments\WishlistPurchaseStatus;
use App\Enums\WishlistItemStatus;
use App\Models\AdminSetting;
use App\Models\User;
use App\Models\Wishlists\WishlistItem;
use App\Models\Wishlists\WishlistPurchase;
use App\Payments\Data\PaymentIntentData;
use App\Payments\Data\WishlistPurchaseData;
use App\ValueObjects\Money;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WishlistService
{
    private const MINIMUM_CONTRIBUTION = 500; // $5.00 in cents

    public function __construct(
        protected readonly PaymentService $payments
    ) {}

    /**
     * Calculate platform fee for a wishlist purchase.
     */
    public function calculateFee(Money $amount): Money
    {
        $feePercent = (float) AdminSetting::get('wishlist_platform_fee_percent', 10.0);
        $feeAmount = (int) round($amount->amount() * ($feePercent / 100));

        return Money::from($feeAmount, $amount->currency());
    }

    /**
     * Initiate a wishlist purchase and payment intent.
     *
     * @return array{purchase: WishlistPurchase, intent: \App\Models\Payments\PaymentIntent}
     *
     * @throws ModelNotFoundException
     * @throws ValidationException
     */
    public function initiatePurchase(WishlistPurchaseData $data, ?string $gateway = null): array
    {
        $item = WishlistItem::query()->whereKey($data->wishlistItemId)->firstOrFail();

        // Validate minimum contribution
        if ($data->amount->amount() < self::MINIMUM_CONTRIBUTION) {
            throw ValidationException::withMessages([
                'amount' => 'Minimum contribution is $5.00.',
            ]);
        }

        // Check if item can be purchased
        if (! $item->canBePurchased()) {
            throw ValidationException::withMessages([
                'item' => 'This wishlist item is no longer available for purchase.',
            ]);
        }

        // Calculate total amount including fee if covers_fee is true
        $amount = $data->amount;
        $feeAmount = Money::from(0, $amount->currency());

        if ($data->coversFee) {
            $feeAmount = $this->calculateFee($amount);
            $amount = Money::from($amount->amount() + $feeAmount->amount(), $amount->currency());
        }

        return DB::transaction(function () use ($item, $data, $amount, $feeAmount, $gateway) {
            $purchase = WishlistPurchase::query()->create([
                'wishlist_item_id' => $item->getKey(),
                'buyer_id' => $data->buyerId,
                'amount' => $data->amount->amount(), // Store original amount
                'currency' => $data->amount->currency(),
                'status' => WishlistPurchaseStatus::Pending,
                'message' => $data->message,
                'covers_fee' => $data->coversFee,
                'metadata' => array_merge($data->metadata, [
                    'fee_amount' => $feeAmount->amount(),
                ]),
            ]);

            // Build return URLs for success/failure pages
            $successUrl = route('wishlist.purchase.success', ['purchase' => $purchase->getKey()]);
            $failureUrl = route('wishlist.purchase.failure', ['purchase' => $purchase->getKey()]);

            $metadata = array_merge($data->metadata, [
                'wishlist_item_id' => $item->getKey(),
                'covers_fee' => $data->coversFee,
                'fee_amount' => $feeAmount->amount(),
                'success_url' => $successUrl,
                'failure_url' => $failureUrl,
                'payment_type' => 'one_time',
                'creator_id' => $data->creatorId,
            ]);

            // Add payment_method_id if provided
            if (isset($data->metadata['payment_method_id'])) {
                $metadata['payment_method_id'] = $data->metadata['payment_method_id'];
            }

            $intentData = new PaymentIntentData(
                payableType: WishlistPurchase::class,
                payableId: $purchase->getKey(),
                amount: $amount, // Total amount including fee if applicable
                payerId: $data->buyerId,
                payeeId: $data->creatorId,
                type: PaymentType::OneTime,
                method: $data->method,
                metadata: $metadata,
                description: $data->message ?? "Wishlist purchase: {$item->title}",
                returnUrl: $successUrl
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

    /**
     * Handle completed purchase - update item funding/quantity and status.
     */
    public function handleCompletedPurchase(WishlistPurchase $purchase): void
    {
        $item = $purchase->item;

        DB::transaction(function () use ($item, $purchase) {
            if ($item->is_crowdfunded) {
                // Update funding for crowdfunded items
                $item->updateFunding($purchase->amount);

                // Check if goal is reached
                if ($item->isFullyFunded()) {
                    $item->markAsFulfilled();
                }
            } else {
                // For fixed-price items, check if quantity is met
                $remaining = $item->remainingQuantity();

                if ($remaining !== null && $remaining <= 0) {
                    $item->markAsFulfilled();
                }
            }
        });
    }

    /**
     * Create a new wishlist item.
     *
     * @param  array<string, mixed>  $data
     */
    public function createItem(User $creator, array $data): WishlistItem
    {
        $requiresApproval = (bool) AdminSetting::get('wishlist_requires_approval', false);

        $item = WishlistItem::query()->create([
            'creator_id' => $creator->getKey(),
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'amount' => $data['amount'] ?? null,
            'currency' => $data['currency'] ?? 'USD',
            'url' => $data['url'] ?? null,
            'image_url' => $data['image_url'] ?? null,
            'quantity' => $data['quantity'] ?? null,
            'is_crowdfunded' => $data['is_crowdfunded'] ?? false,
            'goal_amount' => $data['goal_amount'] ?? null,
            'current_funding' => 0,
            'status' => WishlistItemStatus::Active,
            'expires_at' => isset($data['expires_at']) ? $data['expires_at'] : null,
            'approved_at' => $requiresApproval ? null : now(),
            'is_active' => true,
            'metadata' => $data['metadata'] ?? [],
        ]);

        return $item->fresh();
    }

    /**
     * Update an existing wishlist item.
     *
     * @param  array<string, mixed>  $data
     */
    public function updateItem(WishlistItem $item, array $data): WishlistItem
    {
        $item->update([
            'title' => $data['title'] ?? $item->title,
            'description' => $data['description'] ?? $item->description,
            'amount' => $data['amount'] ?? $item->amount,
            'currency' => $data['currency'] ?? $item->currency,
            'url' => $data['url'] ?? $item->url,
            'image_url' => $data['image_url'] ?? $item->image_url,
            'quantity' => $data['quantity'] ?? $item->quantity,
            'goal_amount' => $data['goal_amount'] ?? $item->goal_amount,
            'expires_at' => $data['expires_at'] ?? $item->expires_at,
            'metadata' => $data['metadata'] ?? $item->metadata,
        ]);

        return $item->fresh();
    }

    /**
     * Soft delete a wishlist item.
     */
    public function deleteItem(WishlistItem $item): bool
    {
        return $item->delete();
    }

    /**
     * Renew a fulfilled wishlist item (restore from soft delete).
     */
    public function renewItem(WishlistItem $item): WishlistItem
    {
        $item->restore();
        $item->update([
            'status' => WishlistItemStatus::Active,
            'current_funding' => 0,
        ]);

        return $item->fresh();
    }

    /**
     * Approve a wishlist item (if approval is required).
     */
    public function approveItem(WishlistItem $item): bool
    {
        if ($item->approved_at !== null) {
            return false;
        }

        return $item->update([
            'approved_at' => now(),
        ]);
    }
}

<?php

namespace App\Http\Resources\Wishlists;

use App\Models\Wishlists\WishlistItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin WishlistItem
 */
class WishlistItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $viewer = $request->user();
        $isCreator = $viewer && $viewer->getKey() === $this->creator_id;

        $purchaseCount = $this->relationLoaded('purchases')
            ? $this->purchases->filter(fn ($p) => $p->status->value === 'completed')->count()
            : $this->completedPurchases()->count();

        $data = [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'title' => $this->title,
            'description' => $this->description,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'url' => $this->url,
            'image_url' => $this->image_url,
            'quantity' => $this->quantity,
            'is_crowdfunded' => $this->is_crowdfunded,
            'goal_amount' => $this->goal_amount,
            'current_funding' => $this->current_funding,
            'status' => $this->status->value,
            'progress_percentage' => $this->progressPercentage(),
            'remaining_quantity' => $this->remainingQuantity(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            'approved_at' => $this->approved_at?->toIso8601String(),
            'is_active' => $this->is_active,
            'can_be_purchased' => $this->canBePurchased(),
            'purchase_count' => $purchaseCount,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];

        // Creator info (always include if creator is available)
        if ($this->creator) {
            $data['creator'] = [
                'id' => $this->creator->id,
                'username' => $this->creator->username,
                'display_name' => $this->creator->display_name ?? $this->creator->username,
                'avatar_url' => $this->creator->avatar_url,
            ];
        }

        // Contributors (only for creator)
        if ($isCreator && $this->relationLoaded('purchases')) {
            $data['contributors'] = WishlistPurchaseResource::collection(
                $this->purchases->filter(fn ($p) => $p->status->value === 'completed')
            );
        }

        return $data;
    }
}

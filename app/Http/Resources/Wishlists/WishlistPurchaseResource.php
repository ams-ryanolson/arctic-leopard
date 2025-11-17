<?php

namespace App\Http\Resources\Wishlists;

use App\Models\Wishlists\WishlistPurchase;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin WishlistPurchase
 */
class WishlistPurchaseResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'message' => $this->message,
            'covers_fee' => $this->covers_fee,
            'status' => $this->status->value,
            'created_at' => $this->created_at?->toIso8601String(),
            'fulfilled_at' => $this->fulfilled_at?->toIso8601String(),
        ];

        // Item info
        if ($this->relationLoaded('item')) {
            $item = $this->item;
            $data['item'] = [
                'id' => $item->id,
                'title' => $item->title,
                'description' => $item->description,
                'image_url' => $item->image_url,
                'is_crowdfunded' => $item->is_crowdfunded,
                'creator' => $this->relationLoaded('item.creator')
                    ? [
                        'id' => $item->creator->id,
                        'username' => $item->creator->username,
                        'display_name' => $item->creator->display_name ?? $item->creator->username,
                        'avatar_url' => $item->creator->avatar_url,
                    ]
                    : null,
            ];
        }

        // Payment info
        if ($this->relationLoaded('payment') && $this->payment) {
            $data['payment'] = [
                'id' => $this->payment->id,
                'amount' => $this->payment->amount,
                'fee_amount' => $this->payment->fee_amount ?? 0,
                'net_amount' => $this->payment->net_amount ?? $this->payment->amount,
                'currency' => $this->payment->currency,
                'provider_payment_id' => $this->payment->provider_payment_id,
            ];
        }

        // Buyer info
        if ($this->relationLoaded('buyer')) {
            $data['buyer'] = [
                'id' => $this->buyer->id,
                'username' => $this->buyer->username,
                'display_name' => $this->buyer->display_name ?? $this->buyer->username,
                'avatar_url' => $this->buyer->avatar_url,
            ];
        }

        return $data;
    }
}

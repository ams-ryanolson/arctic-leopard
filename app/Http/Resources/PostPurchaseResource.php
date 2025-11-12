<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\PostPurchase
 */
class PostPurchaseResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'post_id' => $this->post_id,
            'amount' => $this->amount,
            'currency' => $this->currency,
            'status' => $this->status?->value,
            'payment_id' => $this->payment_id,
            'expires_at' => optional($this->expires_at)->toIso8601String(),
            'fulfilled_at' => optional($this->fulfilled_at)->toIso8601String(),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'metadata' => $this->metadata ?? [],
            'post' => PostResource::make($this->whenLoaded('post')),
        ];
    }
}

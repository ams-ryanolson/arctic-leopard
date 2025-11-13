<?php

namespace App\Http\Resources\Ads;

use App\Models\Ads\AdCampaign;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AdCampaign
 */
class CampaignResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'name' => $this->name,
            'status' => $this->status->value,
            'start_date' => optional($this->start_date)->toIso8601String(),
            'end_date' => optional($this->end_date)->toIso8601String(),
            'total_budget' => $this->total_budget,
            'currency' => $this->currency,
            'spent_amount' => $this->spent_amount,
            'pacing_strategy' => $this->pacing_strategy->value,
            'metadata' => $this->metadata,
            'advertiser' => $this->whenLoaded('advertiser', fn () => [
                'id' => $this->advertiser->id,
                'username' => $this->advertiser->username,
                'display_name' => $this->advertiser->display_name ?? $this->advertiser->name,
            ]),
            'ads' => $this->whenLoaded('ads', fn () => AdResource::collection($this->ads)),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
        ];
    }
}

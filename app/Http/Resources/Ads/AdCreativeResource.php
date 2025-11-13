<?php

namespace App\Http\Resources\Ads;

use App\Models\Ads\AdCreative;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AdCreative
 */
class AdCreativeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ad_id' => $this->ad_id,
            'placement' => $this->placement->value,
            'size' => $this->size->value,
            'asset_type' => $this->asset_type->value,
            'asset_path' => $this->asset_path,
            'asset_url' => $this->asset_url,
            'headline' => $this->headline,
            'body_text' => $this->body_text,
            'cta_text' => $this->cta_text,
            'cta_url' => $this->cta_url,
            'display_order' => $this->display_order,
            'is_active' => $this->is_active,
            'review_status' => $this->review_status,
            'metadata' => $this->metadata,
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
        ];
    }
}

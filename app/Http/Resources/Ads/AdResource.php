<?php

namespace App\Http\Resources\Ads;

use App\Models\Ads\Ad;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Ad
 */
class AdResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $viewer = $request->user();

        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'name' => $this->name,
            'status' => $this->status->value,
            'start_date' => optional($this->start_date)->toIso8601String(),
            'end_date' => optional($this->end_date)->toIso8601String(),
            'max_impressions' => $this->max_impressions,
            'max_clicks' => $this->max_clicks,
            'daily_impression_cap' => $this->daily_impression_cap,
            'daily_click_cap' => $this->daily_click_cap,
            'budget_amount' => $this->budget_amount,
            'budget_currency' => $this->budget_currency,
            'spent_amount' => $this->spent_amount,
            'pricing_model' => $this->pricing_model->value,
            'pricing_rate' => $this->pricing_rate,
            'targeting' => $this->targeting,
            'metadata' => $this->metadata,
            'approved_at' => optional($this->approved_at)->toIso8601String(),
            'rejected_at' => optional($this->rejected_at)->toIso8601String(),
            'rejection_reason' => $this->rejection_reason,
            'advertiser' => $this->whenLoaded('advertiser', fn () => [
                'id' => $this->advertiser->id,
                'username' => $this->advertiser->username,
                'display_name' => $this->advertiser->display_name ?? $this->advertiser->name,
            ]),
            'campaign' => $this->whenLoaded('campaign', fn () => new CampaignResource($this->campaign)),
            'creatives' => $this->relationLoaded('creatives')
                ? AdCreativeResource::collection($this->creatives)->resolve($request)
                : [],
            'impressions_count' => $this->impressions_count ?? null,
            'clicks_count' => $this->clicks_count ?? null,
            'can' => [
                'update' => $viewer ? $viewer->can('update', $this->resource) : false,
                'delete' => $viewer ? $viewer->can('delete', $this->resource) : false,
                'approve' => $viewer ? $viewer->can('approve', $this->resource) : false,
                'reject' => $viewer ? $viewer->can('reject', $this->resource) : false,
                'pause' => $viewer ? $viewer->can('pause', $this->resource) : false,
                'resume' => $viewer ? $viewer->can('resume', $this->resource) : false,
            ],
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
        ];
    }
}

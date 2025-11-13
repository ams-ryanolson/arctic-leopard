<?php

namespace App\Http\Resources\Ads;

use App\Models\Ads\AdReport;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AdReport
 */
class ReportResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ad_id' => $this->ad_id,
            'campaign_id' => $this->campaign_id,
            'placement' => $this->placement,
            'report_date' => optional($this->report_date)->toDateString(),
            'report_type' => $this->report_type,
            'impressions' => $this->impressions,
            'clicks' => $this->clicks,
            'spend' => $this->spend,
            'ctr' => $this->ctr !== null ? (float) $this->ctr : null,
            'cpm' => $this->cpm,
            'cpc' => $this->cpc,
            'metadata' => $this->metadata,
            'generated_at' => optional($this->generated_at)->toIso8601String(),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
        ];
    }
}

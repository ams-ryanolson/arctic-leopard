<?php

namespace App\Http\Resources;

use App\Models\Hashtag;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Hashtag
 */
class HashtagResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'usage_count' => $this->usage_count,
            'recent_usage_count' => $this->recent_usage_count ?? 0,
        ];
    }
}

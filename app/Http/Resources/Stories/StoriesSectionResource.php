<?php

namespace App\Http\Resources\Stories;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Resource for stories section on dashboard.
 */
class StoriesSectionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource['id'],
            'username' => $this->resource['username'],
            'display_name' => $this->resource['display_name'],
            'avatar_url' => $this->resource['avatar_url'],
            'latest_story_preview' => $this->resource['latest_story_preview'],
            'story_count' => $this->resource['story_count'],
            'has_new_stories' => $this->resource['has_new_stories'],
            'first_story_id' => $this->resource['first_story_id'] ?? null,
        ];
    }
}

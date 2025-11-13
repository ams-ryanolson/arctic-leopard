<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\EventMedia
 */
class EventMediaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'disk' => $this->disk,
            'path' => $this->path,
            'thumbnail_path' => $this->thumbnail_path,
            'media_type' => $this->media_type,
            'title' => $this->title,
            'caption' => $this->caption,
            'position' => (int) ($this->position ?? 0),
            'meta' => $this->meta ?? [],
            'uploaded_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}

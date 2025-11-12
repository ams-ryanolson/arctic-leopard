<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookmarkResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $post = $this->whenLoaded('post');

        if ($post !== null) {
            $post->setAttribute('bookmark_id', $this->resource->getKey());
        }

        return [
            'id' => $this->resource->getKey(),
            'visibility_source' => 'bookmarked',
            'context' => [
                'location' => 'bookmarks',
                'bookmark_id' => $this->resource->getKey(),
            ],
            'visible_at' => optional($this->resource->created_at)->toIso8601String(),
            'created_at' => optional($this->resource->created_at)->toIso8601String(),
            'post' => $post ? PostResource::make($post) : null,
        ];
    }
}

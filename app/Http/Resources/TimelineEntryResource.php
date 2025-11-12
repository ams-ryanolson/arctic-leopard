<?php

namespace App\Http\Resources;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Timeline
 */
class TimelineEntryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $post = $this->relationLoaded('post')
            ? $this->post
            : \App\Models\Post::query()
                ->with([
                    'author',
                    'media',
                    'poll.options',
                    'hashtags',
                ])
                ->find($this->post_id);

        if ($post) {
            $post->loadMissing([
                'author',
                'media',
                'poll.options',
                'hashtags',
            ]);
        }

        return [
            'id' => $this->id,
            'visibility_source' => $this->visibility_source instanceof \App\Enums\TimelineVisibilitySource
                ? $this->visibility_source->value
                : $this->visibility_source,
            'context' => $this->context ?? [],
            'visible_at' => optional($this->visible_at)->toIso8601String(),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'post' => $post ? PostResource::make($post) : null,
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Comment
 */
class CommentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $viewer = $request->user();
        $hidden = method_exists($this->resource, 'isHiddenFor')
            ? $this->resource->isHiddenFor($viewer)
            : false;

        return [
            'id' => $this->id,
            'body' => $hidden ? null : $this->body,
            'parent_id' => $this->parent_id,
            'depth' => $this->depth,
            'is_pinned' => (bool) $this->is_pinned,
            'likes_count' => $this->likes_count,
            'replies_count' => $this->replies_count,
            'created_at' => optional($this->created_at)->toIso8601String(),
            'edited_at' => optional($this->edited_at)->toIso8601String(),
            'deleted_at' => optional($this->deleted_at)->toIso8601String(),
            'is_deleted' => $this->trashed(),
            'has_liked' => (bool) ($this->has_liked ?? false),
            'can_delete' => $request->user() ? $request->user()->can('delete', $this->resource) : false,
            'can_reply' => $request->user() ? $request->user()->can('reply', $this->resource) : false,
            'can_like' => $request->user() ? $request->user()->can('like', $this->resource) : false,
            'is_hidden' => $hidden,
            'placeholder' => $hidden ? __('This comment is hidden.') : null,
            'author' => $hidden
                ? null
                : UserSummaryResource::make($this->whenLoaded('author')),
            'replies' => CommentResource::collection($this->whenLoaded('replies')),
        ];
    }
}

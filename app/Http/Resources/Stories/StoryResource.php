<?php

namespace App\Http\Resources\Stories;

use App\Enums\StoryAudience;
use App\Services\Stories\StoryService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Story
 */
class StoryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $audience = $this->audience instanceof StoryAudience ? $this->audience->value : $this->audience;
        $viewer = $request->user();

        // Get preview data (may include blurred image for subscriber-only)
        $storyService = app(StoryService::class);
        $preview = $storyService->getStoryPreview($this->resource, $viewer);

        $author = null;
        if ($this->relationLoaded('user') && $this->user) {
            $author = [
                'id' => $this->user->id,
                'username' => $this->user->username,
                'display_name' => $this->user->display_name ?? $this->user->name,
                'name' => $this->user->name,
                'avatar_url' => $this->user->avatar_url,
                'is_verified' => (bool) $this->user->email_verified_at,
            ];
        }

        $media = null;
        if ($this->relationLoaded('media') && $this->media) {
            $media = [
                'id' => $this->media->id,
                'url' => $preview['url'],
                'optimized_url' => $preview['optimized_url'] ?? null,
                'thumbnail_url' => $preview['thumbnail_url'],
                'blur_url' => $preview['blur_url'],
                'is_blurred' => $preview['is_blurred'] ?? false,
                'mime_type' => $this->media->mime_type,
                'width' => $this->media->width,
                'height' => $this->media->height,
                'duration' => $this->media->duration,
            ];
        }

        // Get reactions summary
        $reactions = [];
        if ($this->relationLoaded('reactions')) {
            $reactions = $this->reactions
                ->groupBy('emoji')
                ->map(function ($group) use ($viewer) {
                    return [
                        'emoji' => $group->first()->emoji,
                        'count' => $group->count(),
                        'reacted' => $viewer !== null && $group->contains(fn ($reaction) => $reaction->user_id === $viewer->getKey()),
                    ];
                })
                ->values()
                ->all();
        }

        // Check if viewer has viewed this story
        $hasViewed = false;
        if ($viewer !== null) {
            $hasViewed = $this->views()
                ->where('user_id', $viewer->getKey())
                ->exists();
        }

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'position' => $this->position,
            'audience' => $audience,
            'is_subscriber_only' => (bool) $this->is_subscriber_only,
            'scheduled_at' => optional($this->scheduled_at)->toIso8601String(),
            'published_at' => optional($this->published_at)->toIso8601String(),
            'expires_at' => optional($this->expires_at)->toIso8601String(),
            'views_count' => (int) ($this->views_count ?? 0),
            'reactions_count' => (int) ($this->reactions_count ?? 0),
            'has_viewed' => $hasViewed,
            'is_expired' => $this->isExpired(),
            'author' => $author,
            'media' => $media,
            'reactions' => $reactions,
            'viewer_reactions' => $this->viewer_reactions ?? [],
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
            'can' => [
                'viewAnalytics' => $viewer?->can('viewAnalytics', $this->resource) ?? false,
                'delete' => $viewer?->can('delete', $this->resource) ?? false,
            ],
        ];
    }
}

<?php

namespace App\Http\Resources;

use App\Enums\PostAudience;
use App\Enums\PostType;
use App\Support\Audience\AudienceDecision;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Post
 */
class PostResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $type = $this->type instanceof PostType ? $this->type->value : $this->type;
        $audience = $this->audience instanceof PostAudience ? $this->audience->value : $this->audience;

        // Ensure repostedPost is loaded for amplify posts so policy can check original author
        if ($this->type === PostType::Amplify && ! $this->relationLoaded('repostedPost')) {
            $this->loadMissing('repostedPost');
        }

        $decision = AudienceDecision::make($this->resource, $request->user());
        $extraAttributes = $this->extra_attributes ?? [];

        if (! is_array($extraAttributes)) {
            $extraAttributes = (array) $extraAttributes;
        }

        $hashtags = $this->relationLoaded('hashtags')
            ? $this->hashtags->pluck('name')->all()
            : [];

        $author = null;

        if ($this->relationLoaded('author') && $this->author) {
            $author = [
                'id' => $this->author->id,
                'username' => $this->author->username,
                'display_name' => $this->author->display_name ?? $this->author->name,
                'name' => $this->author->name,
                'avatar_url' => $this->author->avatar_url,
                'is_verified' => (bool) $this->author->email_verified_at,
            ];
        }

        $bookmarkCount = $this->relationLoaded('bookmarks')
            ? $this->bookmarks->count()
            : (int) ($this->bookmarks_count ?? $this->bookmark_count ?? 0);

        $isBookmarked = (bool) ($this->is_bookmarked ?? $this->viewer_has_bookmarked ?? false);
        $bookmarkId = $this->bookmark_id ?? null;
        $hasAmplified = (bool) ($this->has_amplified ?? $this->viewer_has_amplified ?? false);
        $isAmplify = $this->type === PostType::Amplify;

        $originalPost = null;
        if ($isAmplify && $this->relationLoaded('repostedPost') && $this->repostedPost) {
            $originalPost = (new self($this->repostedPost))->toArray($request);
        }

        $amplifiedBy = [];
        if ($this->relationLoaded('amplifiedBy') && ! $isAmplify) {
            $amplifiedBy = $this->amplifiedBy
                ->take(10)
                ->map(function ($repost) {
                    $user = $repost->user;
                    if (! $user) {
                        return null;
                    }

                    return [
                        'id' => $user->id,
                        'username' => $user->username,
                        'display_name' => $user->display_name ?? $user->name,
                        'name' => $user->name,
                        'avatar_url' => $user->avatar_url,
                        'is_verified' => (bool) $user->email_verified_at,
                    ];
                })
                ->filter()
                ->values()
                ->all();
        }

        return [
            'id' => $this->id,
            'ulid' => $this->ulid,
            'type' => $type,
            'audience' => $audience,
            'is_system' => (bool) $this->is_system,
            'is_pinned' => (bool) $this->is_pinned,
            'body' => $this->body,
            'extra_attributes' => $extraAttributes,
            'likes_count' => (int) ($this->likes_count ?? 0),
            'has_liked' => (bool) ($this->has_liked ?? false),
            'comments_count' => (int) ($this->comments_count ?? 0),
            'reposts_count' => (int) ($this->reposts_count ?? 0),
            'has_amplified' => $hasAmplified,
            'reposted_post_id' => $isAmplify ? $this->reposted_post_id : null,
            'original_post' => $originalPost,
            'amplified_by' => $amplifiedBy,
            'poll_votes_count' => (int) ($this->poll_votes_count ?? 0),
            'views_count' => (int) ($this->views_count ?? 0),
            'bookmark_count' => $bookmarkCount,
            'is_bookmarked' => $isBookmarked,
            'bookmark_id' => $bookmarkId !== null ? (int) $bookmarkId : null,
            'paywall_price' => $this->paywall_price,
            'paywall_currency' => $this->paywall_currency,
            'scheduled_at' => optional($this->scheduled_at)->toIso8601String(),
            'published_at' => optional($this->published_at)->toIso8601String(),
            'expires_at' => optional($this->expires_at)->toIso8601String(),
            'locked' => $decision->requiresPurchase(),
            'author' => $author,
            'media' => $this->relationLoaded('media')
                ? $this->media
                    ->map(fn ($media) => (new PostMediaResource($media))->toArray($request))
                    ->all()
                : [],
            'poll' => $this->relationLoaded('poll') && $this->poll !== null
                ? [
                    'id' => $this->poll->id,
                    'question' => $this->poll->question,
                    'allow_multiple' => (bool) $this->poll->allow_multiple,
                    'max_choices' => $this->poll->max_choices,
                    'closes_at' => optional($this->poll->closes_at)->toIso8601String(),
                    'options' => $this->poll->relationLoaded('options')
                        ? $this->poll->options
                            ->map(fn ($option) => (new PollOptionResource($option))->toArray($request))
                            ->all()
                        : [],
                ]
                : null,
            'hashtags' => $hashtags,
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
            'can' => [
                'viewAnalytics' => $request->user()?->can('viewAnalytics', $this->resource) ?? false,
                'bookmark' => $request->user()?->can('bookmark', $this->resource) ?? false,
            ],
        ];
    }
}

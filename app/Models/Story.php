<?php

namespace App\Models;

use App\Enums\ModerationStatus;
use App\Enums\StoryAudience;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class Story extends Model
{
    /** @use HasFactory<\Database\Factories\StoryFactory> */
    use HasFactory;

    use SoftDeletes;

    protected static function booted(): void
    {
        static::saving(function (Story $story): void {
            // Calculate expires_at when published_at is set
            if ($story->isDirty('published_at') && $story->published_at !== null) {
                $expirationHours = (int) config('stories.expiration_hours', 24);
                $story->expires_at = $story->published_at->copy()->addHours($expirationHours);
            }
        });
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'position',
        'audience',
        'is_subscriber_only',
        'scheduled_at',
        'published_at',
        'expires_at',
        'moderation_status',
        'moderated_at',
        'moderated_by_id',
        'moderation_notes',
        'rejection_reason',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'audience' => StoryAudience::class,
            'is_subscriber_only' => 'boolean',
            'position' => 'integer',
            'views_count' => 'integer',
            'reactions_count' => 'integer',
            'scheduled_at' => 'datetime',
            'published_at' => 'datetime',
            'expires_at' => 'datetime',
            'moderation_status' => ModerationStatus::class,
            'moderated_at' => 'datetime',
        ];
    }

    /**
     * Author of the story.
     *
     * @return BelongsTo<User, Story>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Media attachment for the story.
     *
     * @return HasOne<StoryMedia>
     */
    public function media(): HasOne
    {
        return $this->hasOne(StoryMedia::class);
    }

    /**
     * Views of the story.
     *
     * @return HasMany<StoryView>
     */
    public function views(): HasMany
    {
        return $this->hasMany(StoryView::class);
    }

    /**
     * Reactions on the story.
     *
     * @return HasMany<StoryReaction>
     */
    public function reactions(): HasMany
    {
        return $this->hasMany(StoryReaction::class);
    }

    /**
     * Users who viewed the story.
     *
     * @return BelongsToMany<User>
     */
    public function viewers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'story_views')
            ->withPivot('viewed_at')
            ->withTimestamps();
    }

    /**
     * Scope stories that are published.
     *
     * @param  Builder<Story>  $query
     * @return Builder<Story>
     */
    public function scopePublished(Builder $query): Builder
    {
        $now = Carbon::now();

        return $query->whereNotNull('published_at')
            ->where('published_at', '<=', $now);
    }

    /**
     * Scope stories that are not expired.
     *
     * @param  Builder<Story>  $query
     * @return Builder<Story>
     */
    public function scopeNotExpired(Builder $query): Builder
    {
        $now = Carbon::now();

        return $query->where(function (Builder $builder) use ($now): void {
            $builder->whereNull('expires_at')
                ->orWhere('expires_at', '>', $now);
        });
    }

    /**
     * Scope stories that are active (published and not expired).
     *
     * @param  Builder<Story>  $query
     * @return Builder<Story>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->published()->notExpired();
    }

    /**
     * Scope stories that are subscriber-only.
     *
     * @param  Builder<Story>  $query
     * @return Builder<Story>
     */
    public function scopeSubscriberOnly(Builder $query): Builder
    {
        return $query->where('is_subscriber_only', true);
    }

    /**
     * Scope stories visible to the viewer (filtered by audience, blocks, subscriptions).
     * This is a basic scope - detailed filtering should be done in StoryService.
     *
     * @param  Builder<Story>  $query
     * @return Builder<Story>
     */
    public function scopeForViewer(Builder $query, ?User $viewer): Builder
    {
        if ($viewer === null) {
            return $query->where('audience', StoryAudience::Public->value);
        }

        return $query->where(function (Builder $builder) use ($viewer): void {
            $builder->where('audience', StoryAudience::Public->value)
                ->orWhere(function (Builder $followers) use ($viewer): void {
                    $followers->where('audience', StoryAudience::Followers->value)
                        ->whereHas('user', function (Builder $userQuery) use ($viewer): void {
                            $userQuery->whereHas('approvedFollowers', function (Builder $followersQuery) use ($viewer): void {
                                $followersQuery->where('users.id', $viewer->getKey());
                            });
                        });
                })
                ->orWhere(function (Builder $subscribers) use ($viewer): void {
                    $subscribers->where('audience', StoryAudience::Subscribers->value)
                        ->whereHas('user', function (Builder $userQuery) use ($viewer): void {
                            $userQuery->whereHas('subscribers', function (Builder $subscribersQuery) use ($viewer): void {
                                $subscribersQuery->where('users.id', $viewer->getKey());
                            });
                        });
                });
        });
    }

    /**
     * Check if the story is expired.
     */
    public function isExpired(): bool
    {
        if ($this->expires_at === null) {
            return false;
        }

        return $this->expires_at->isPast();
    }

    /**
     * Check if the story can be viewed by the given user.
     * This is a basic check - detailed permission logic should be in StoryService.
     */
    public function canBeViewedBy(?User $viewer): bool
    {
        // Story must be published and not expired
        if ($this->published_at === null || $this->published_at->isFuture()) {
            return false;
        }

        if ($this->isExpired()) {
            return false;
        }

        // Author can always view their own story
        if ($viewer !== null && $this->user_id === $viewer->getKey()) {
            return true;
        }

        // Check audience
        $audience = $this->audience instanceof StoryAudience
            ? $this->audience
            : StoryAudience::from($this->audience);

        if ($audience === StoryAudience::Public) {
            return true;
        }

        if ($viewer === null) {
            return false;
        }

        if ($audience === StoryAudience::Followers) {
            // Check if viewer follows the author
            return $this->user->approvedFollowers()->where('users.id', $viewer->getKey())->exists();
        }

        if ($audience === StoryAudience::Subscribers) {
            // Check if viewer is subscribed to the author
            return $this->user->isSubscribedByUser($viewer);
        }

        return false;
    }

    /**
     * Mark the story as viewed by the given user.
     */
    public function markAsViewedBy(User $viewer): void
    {
        // Check if already viewed
        if ($this->views()->where('user_id', $viewer->getKey())->exists()) {
            return;
        }

        $this->views()->create([
            'user_id' => $viewer->getKey(),
            'viewed_at' => Carbon::now(),
        ]);

        $this->incrementViewsCount();
    }

    /**
     * Increment the views count.
     */
    public function incrementViewsCount(): void
    {
        $this->increment('views_count');
    }

    /**
     * Increment the reactions count.
     */
    public function incrementReactionsCount(): void
    {
        $this->increment('reactions_count');
    }

    /**
     * Decrement the reactions count.
     */
    public function decrementReactionsCount(): void
    {
        if ($this->reactions_count > 0) {
            $this->decrement('reactions_count');
        }
    }

    /**
     * Retrieve the model for route model binding.
     * Only allow active (non-expired, published) stories to be accessed via routes.
     *
     * @param  mixed  $value
     * @param  string|null  $field
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function resolveRouteBinding($value, $field = null)
    {
        $field = $field ?: $this->getRouteKeyName();

        return $this->where($field, $value)
            ->whereNull('deleted_at') // Exclude soft-deleted stories
            ->first();
    }

    /**
     * Admin who moderated this story.
     *
     * @return BelongsTo<User, Story>
     */
    public function moderatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'moderated_by_id');
    }

    /**
     * Moderation queue entry for this story.
     *
     * @return MorphOne<ContentModerationQueue>
     */
    public function moderationQueue(): MorphOne
    {
        return $this->morphOne(ContentModerationQueue::class, 'moderatable');
    }

    /**
     * Check if the story is pending moderation.
     */
    public function isPendingModeration(): bool
    {
        return $this->moderation_status === ModerationStatus::Pending;
    }

    /**
     * Check if the story is approved.
     */
    public function isApproved(): bool
    {
        return $this->moderation_status === ModerationStatus::Approved;
    }

    /**
     * Check if the story is rejected.
     */
    public function isRejected(): bool
    {
        return $this->moderation_status === ModerationStatus::Rejected;
    }

    /**
     * Check if moderation is required (based on feature flag).
     */
    public function requiresModeration(): bool
    {
        return \App\Models\AdminSetting::get('content_moderation_required', false);
    }

    /**
     * Approve the story for moderation.
     */
    public function approveModeration(User $moderator, ?string $notes = null): void
    {
        $this->update([
            'moderation_status' => ModerationStatus::Approved,
            'moderated_at' => now(),
            'moderated_by_id' => $moderator->getKey(),
            'moderation_notes' => $notes,
        ]);

        $this->moderationQueue?->approve($moderator, $notes);
    }

    /**
     * Reject the story for moderation.
     */
    public function rejectModeration(User $moderator, string $reason, ?string $notes = null): void
    {
        $this->update([
            'moderation_status' => ModerationStatus::Rejected,
            'moderated_at' => now(),
            'moderated_by_id' => $moderator->getKey(),
            'rejection_reason' => $reason,
            'moderation_notes' => $notes,
        ]);

        $this->moderationQueue?->reject($moderator, $reason, $notes);
    }

    /**
     * Scope to stories pending moderation.
     *
     * @param  Builder<Story>  $query
     */
    public function scopePendingModeration(Builder $query): void
    {
        $query->where('moderation_status', ModerationStatus::Pending);
    }

    /**
     * Scope to approved stories.
     *
     * @param  Builder<Story>  $query
     */
    public function scopeApproved(Builder $query): void
    {
        $query->where('moderation_status', ModerationStatus::Approved);
    }

    /**
     * Scope to rejected stories.
     *
     * @param  Builder<Story>  $query
     */
    public function scopeRejected(Builder $query): void
    {
        $query->where('moderation_status', ModerationStatus::Rejected);
    }
}

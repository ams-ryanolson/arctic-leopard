<?php

namespace App\Models;

use App\Enums\ModerationStatus;
use App\Enums\Payments\PaymentSubscriptionStatus;
use App\Enums\PostAudience;
use App\Enums\PostType;
use App\Events\PostAudienceChanged;
use App\Events\PostDeleted as PostDeletedEvent;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Overtrue\LaravelLike\Traits\Likeable;

class Post extends Model
{
    /** @use HasFactory<\Database\Factories\PostFactory> */
    use HasFactory;

    use Likeable;
    use SoftDeletes;

    protected static function booted(): void
    {
        static::deleted(function (Post $post): void {
            event(new PostDeletedEvent($post));
        });

        static::updated(function (Post $post): void {
            if ($post->wasChanged('audience')) {
                $original = $post->getOriginal('audience');
                $previousAudience = $original instanceof PostAudience
                    ? $original
                    : PostAudience::from($original);

                $currentAudience = $post->audience instanceof PostAudience
                    ? $post->audience
                    : PostAudience::from($post->audience);

                event(new PostAudienceChanged($post, $previousAudience, $currentAudience));
            }
        });
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'type',
        'audience',
        'is_system',
        'is_pinned',
        'body',
        'extra_attributes',
        'paywall_price',
        'paywall_currency',
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
            'type' => PostType::class,
            'audience' => PostAudience::class,
            'is_system' => 'boolean',
            'is_pinned' => 'boolean',
            'extra_attributes' => 'array',
            'scheduled_at' => 'datetime',
            'published_at' => 'datetime',
            'expires_at' => 'datetime',
            'moderation_status' => ModerationStatus::class,
            'moderated_at' => 'datetime',
        ];
    }

    /**
     * Author of the post.
     *
     * @return BelongsTo<User, Post>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Media attachments belonging to the post.
     *
     * @return HasMany<PostMedia>
     */
    public function media(): HasMany
    {
        return $this->hasMany(PostMedia::class)->orderBy('position');
    }

    /**
     * Poll associated with the post.
     *
     * @return HasOne<PostPoll>
     */
    public function poll(): HasOne
    {
        return $this->hasOne(PostPoll::class);
    }

    /**
     * Comments associated with the post.
     *
     * @return HasMany<Comment>
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Bookmarks associated with the post.
     *
     * @return HasMany<Bookmark>
     */
    public function bookmarks(): HasMany
    {
        return $this->hasMany(Bookmark::class);
    }

    /**
     * Hashtags attached to the post.
     *
     * @return BelongsToMany<Hashtag>
     */
    public function hashtags(): BelongsToMany
    {
        return $this->belongsToMany(Hashtag::class, 'post_hashtag')
            ->withTimestamps()
            ->withPivot('position')
            ->orderBy('post_hashtag.position');
    }

    /**
     * Circles associated with this post.
     *
     * @return BelongsToMany<Circle>
     */
    public function circles(): BelongsToMany
    {
        return $this->belongsToMany(Circle::class, 'circle_post')
            ->withPivot('is_primary')
            ->withTimestamps();
    }

    /**
     * Timeline entries referencing this post.
     *
     * @return HasMany<Timeline>
     */
    public function timelineEntries(): HasMany
    {
        return $this->hasMany(Timeline::class);
    }

    /**
     * Purchases unlocking this post.
     *
     * @return HasMany<PostPurchase>
     */
    public function purchases(): HasMany
    {
        return $this->hasMany(PostPurchase::class);
    }

    /**
     * Daily metrics for this post.
     *
     * @return HasMany<PostMetricDaily>
     */
    public function dailyMetrics(): HasMany
    {
        return $this->hasMany(PostMetricDaily::class);
    }

    /**
     * Admin who moderated this post.
     *
     * @return BelongsTo<User, Post>
     */
    public function moderatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'moderated_by_id');
    }

    /**
     * Moderation queue entry for this post.
     *
     * @return MorphOne<ContentModerationQueue>
     */
    public function moderationQueue(): MorphOne
    {
        return $this->morphOne(ContentModerationQueue::class, 'moderatable');
    }

    /**
     * Check if the post is pending moderation.
     */
    public function isPendingModeration(): bool
    {
        return $this->moderation_status === ModerationStatus::Pending;
    }

    /**
     * Check if the post is approved.
     */
    public function isApproved(): bool
    {
        return $this->moderation_status === ModerationStatus::Approved;
    }

    /**
     * Check if the post is rejected.
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
     * Approve the post for moderation.
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
     * Reject the post for moderation.
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
     * Scope to posts pending moderation.
     *
     * @param  Builder<Post>  $query
     */
    public function scopePendingModeration(Builder $query): void
    {
        $query->where('moderation_status', ModerationStatus::Pending);
    }

    /**
     * Scope to approved posts.
     *
     * @param  Builder<Post>  $query
     */
    public function scopeApproved(Builder $query): void
    {
        $query->where('moderation_status', ModerationStatus::Approved);
    }

    /**
     * Scope to rejected posts.
     *
     * @param  Builder<Post>  $query
     */
    public function scopeRejected(Builder $query): void
    {
        $query->where('moderation_status', ModerationStatus::Rejected);
    }

    /**
     * Scope posts that are published and active.
     *
     * @param  Builder<Post>  $query
     * @return Builder<Post>
     */
    public function scopePublished(Builder $query): Builder
    {
        $now = Carbon::now();

        return $query
            ->where(function (Builder $builder) use ($now): void {
                $builder->where('is_system', true)
                    ->orWhere(function (Builder $published) use ($now): void {
                        $published->whereNotNull('published_at')
                            ->where('published_at', '<=', $now);
                    });
            })
            ->where(function (Builder $builder) use ($now): void {
                $builder->whereNull('scheduled_at')->orWhere('scheduled_at', '<=', $now);
            })
            ->where(function (Builder $builder) use ($now): void {
                $builder->whereNull('expires_at')->orWhere('expires_at', '>', $now);
            });
    }

    /**
     * Scope posts authored by the provided user.
     *
     * @param  Builder<Post>  $query
     * @return Builder<Post>
     */
    public function scopeForAuthor(Builder $query, User|int $author): Builder
    {
        $authorId = $author instanceof User ? $author->getKey() : $author;

        return $query->where('user_id', $authorId);
    }

    /**
     * Scope posts that have been bookmarked by the provided user.
     *
     * @param  Builder<Post>  $query
     * @return Builder<Post>
     */
    public function scopeBookmarkedBy(Builder $query, User|int $user): Builder
    {
        $userId = $user instanceof User ? $user->getKey() : $user;

        return $query->whereHas('bookmarks', function (Builder $builder) use ($userId): void {
            $builder->where('user_id', $userId);
        });
    }

    /**
     * Scope posts including viewer bookmark state.
     *
     * @param  Builder<Post>  $query
     * @return Builder<Post>
     */
    public function scopeWithBookmarkStateFor(Builder $query, ?User $viewer): Builder
    {
        if ($viewer === null) {
            return $query->withExists([
                'bookmarks as viewer_has_bookmarked' => static function (Builder $builder): void {
                    $builder->whereRaw('1 = 0');
                },
            ]);
        }

        return $query->withExists([
            'bookmarks as viewer_has_bookmarked' => static function (Builder $builder) use ($viewer): void {
                $builder->where('user_id', $viewer->getKey());
            },
        ]);
    }

    /**
     * Scope posts visible to the provided viewer.
     *
     * @param  Builder<Post>  $query
     * @return Builder<Post>
     */
    public function scopeVisibleTo(Builder $query, ?User $viewer): Builder
    {
        $userModel = new User;
        $followTable = config('follow.followables_table', 'followables');
        $followUserKey = config('follow.user_foreign_key', 'user_id');
        $subscriptionsTable = 'payment_subscriptions';
        $subscriptionViewerKey = 'subscriber_id';
        $subscriptionCreatorKey = 'creator_id';
        $activeSubscriptionStatuses = [
            PaymentSubscriptionStatus::Active->value,
            PaymentSubscriptionStatus::Trialing->value,
            PaymentSubscriptionStatus::Grace->value,
        ];

        $query->published()
            ->excludeBlockedFor($viewer)
            ->where(function (Builder $builder) use (
                $viewer,
                $userModel,
                $followTable,
                $followUserKey,
                $subscriptionsTable,
                $subscriptionViewerKey,
                $subscriptionCreatorKey,
                $activeSubscriptionStatuses
            ): void {
                $builder->where('audience', PostAudience::Public->value)
                    ->orWhere('is_system', true);

                if ($viewer === null) {
                    return;
                }

                $builder->orWhere('user_id', $viewer->getKey());

                $builder->orWhere(function (Builder $followers) use ($viewer, $userModel, $followTable, $followUserKey): void {
                    $followers->where('audience', PostAudience::Followers->value)
                        ->whereIn('user_id', function ($sub) use ($viewer, $userModel, $followTable, $followUserKey) {
                            $sub->select('followable_id')
                                ->from($followTable)
                                ->where('followable_type', $userModel->getMorphClass())
                                ->where($followUserKey, $viewer->getKey())
                                ->whereNotNull('accepted_at');
                        });
                });

                $builder->orWhere(function (Builder $subscribers) use ($viewer, $subscriptionsTable, $subscriptionViewerKey, $subscriptionCreatorKey, $activeSubscriptionStatuses): void {
                    $subscribers->where('audience', PostAudience::Subscribers->value)
                        ->whereIn('user_id', function ($sub) use ($viewer, $subscriptionsTable, $subscriptionViewerKey, $subscriptionCreatorKey, $activeSubscriptionStatuses) {
                            $sub->select($subscriptionCreatorKey)
                                ->from($subscriptionsTable)
                                ->where($subscriptionViewerKey, $viewer->getKey())
                                ->whereIn('status', $activeSubscriptionStatuses)
                                ->where(function ($expiration): void {
                                    $expiration->whereNull('ends_at')
                                        ->orWhere('ends_at', '>', Carbon::now());
                                })
                                ->where(function ($grace): void {
                                    $grace->whereNull('grace_ends_at')
                                        ->orWhere('grace_ends_at', '>', Carbon::now());
                                });
                        });
                });

                $builder->orWhere(function (Builder $paywall) use ($viewer): void {
                    $paywall->where('audience', PostAudience::PayToView->value)
                        ->whereIn('posts.id', function ($sub) use ($viewer) {
                            $sub->select('post_id')
                                ->from('post_purchases')
                                ->where('user_id', $viewer->getKey())
                                ->where(function ($expiration): void {
                                    $expiration->whereNull('expires_at')
                                        ->orWhere('expires_at', '>', Carbon::now());
                                });
                        });
                });
            });

        return $query;
    }

    /**
     * Exclude posts where the author has blocked the viewer or vice versa.
     *
     * @param  Builder<Post>  $query
     * @return Builder<Post>
     */
    public function scopeExcludeBlockedFor(Builder $query, ?User $viewer): Builder
    {
        if ($viewer === null) {
            return $query;
        }

        $now = Carbon::now();

        return $query
            ->whereNotIn('user_id', function ($sub) use ($viewer, $now) {
                $sub->select('blocked_id')
                    ->from('user_blocks')
                    ->where('blocker_id', $viewer->getKey())
                    ->where(function ($expiry) use ($now): void {
                        $expiry->whereNull('expires_at')
                            ->orWhere('expires_at', '>', $now);
                    });
            })
            ->whereNotExists(function ($sub) use ($viewer, $now) {
                $sub->selectRaw('1')
                    ->from('user_blocks')
                    ->whereColumn('user_blocks.blocker_id', 'posts.user_id')
                    ->where('user_blocks.blocked_id', $viewer->getKey())
                    ->where(function ($expiry) use ($now): void {
                        $expiry->whereNull('expires_at')
                            ->orWhere('expires_at', '>', $now);
                    });
            });
    }

    protected function bookmarkCount(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (array_key_exists('bookmark_count', $this->attributes)) {
                    return (int) $this->attributes['bookmark_count'];
                }

                if (array_key_exists('bookmarks_count', $this->attributes)) {
                    return (int) $this->attributes['bookmarks_count'];
                }

                if ($this->relationLoaded('bookmarks')) {
                    return $this->bookmarks->count();
                }

                return $this->bookmarks()->count();
            },
        );
    }
}

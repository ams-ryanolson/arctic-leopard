<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\Payments\PaymentSubscriptionStatus;
use App\Models\Memberships\UserMembership;
use App\Models\Payments\PaymentSubscription;
use App\Models\Payments\SubscriptionPlan;
use App\Models\Payments\Tip;
use App\Models\Wishlists\WishlistItem;
use App\Models\Wishlists\WishlistPurchase;
use App\Services\Payments\EntitlementService;
use Illuminate\Contracts\Pagination\Paginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model as EloquentModel;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Pagination\AbstractCursorPaginator;
use Illuminate\Pagination\AbstractPaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Str;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;
use Overtrue\LaravelFavorite\Traits\Favoriter;
use Overtrue\LaravelFollow\Traits\Followable;
use Overtrue\LaravelFollow\Traits\Follower;
use Overtrue\LaravelLike\Traits\Liker;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use Favoriter;
    use Followable;
    use Follower;

    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens;

    use HasFactory;
    use HasRoles;
    use Liker;
    use Notifiable;
    use TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'username',
        'username_lower',
        'email',
        'password',
        'name',
        'display_name',
        'pronouns',
        'gender',
        'role',
        'bio',
        'birthdate',
        'location_city',
        'location_region',
        'location_country',
        'location_latitude',
        'location_longitude',
        'accepted_terms_at',
        'accepted_privacy_at',
        'profile_completed_at',
        'is_traveling',
        'avatar_path',
        'cover_path',
        'requires_follow_approval',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'birthdate' => 'date',
            'location_latitude' => 'float',
            'location_longitude' => 'float',
            'accepted_terms_at' => 'datetime',
            'accepted_privacy_at' => 'datetime',
            'profile_completed_at' => 'datetime',
            'requires_follow_approval' => 'bool',
            'is_traveling' => 'bool',
            'creator_status_disabled_at' => 'datetime',
        ];
    }

    /**
     * Normalize the username while ensuring a case-insensitive index is maintained.
     */
    protected function username(): Attribute
    {
        return Attribute::make(
            set: function (mixed $value): array {
                $normalized = is_string($value) ? trim($value) : $value;
                $lowered = is_string($normalized) ? Str::lower($normalized) : $normalized;

                return [
                    'username' => $normalized,
                    'username_lower' => $lowered,
                ];
            },
        );
    }

    /**
     * Interests that the user has selected.
     *
     * @return BelongsToMany<Interest>
     */
    public function interests(): BelongsToMany
    {
        return $this->belongsToMany(Interest::class)
            ->withTimestamps()
            ->orderBy('name');
    }

    /**
     * Hashtags that the user has associated with their profile.
     *
     * @return BelongsToMany<Hashtag>
     */
    public function hashtags(): BelongsToMany
    {
        return $this->belongsToMany(Hashtag::class)
            ->withTimestamps()
            ->orderBy('name');
    }

    public function needsToApproveFollowRequests(): bool
    {
        return $this->requires_follow_approval;
    }

    /**
     * Pending follow requests awaiting approval.
     *
     * @return BelongsToMany<self>
     */
    public function pendingFollowers(): BelongsToMany
    {
        return $this->notApprovedFollowers();
    }

    /**
     * Follow requests this user has made that have not been accepted yet.
     *
     * @return HasMany<\Overtrue\LaravelFollow\Followable>
     */
    public function pendingFollowings(): HasMany
    {
        return $this->notApprovedFollowings();
    }

    /**
     * Determine the broadcast channels for notification delivery.
     *
     * @return array<int, string>|string
     */
    public function receivesBroadcastNotificationsOn($notification = null): array|string
    {
        return sprintf('users.%d.notifications', $this->getKey());
    }

    /**
     * Circles the user participates in.
     *
     * @return BelongsToMany<Circle>
     */
    public function circles(): BelongsToMany
    {
        return $this->belongsToMany(Circle::class, 'circle_members')
            ->withPivot([
                'role',
                'preferences',
                'joined_at',
            ])
            ->withTimestamps();
    }

    /**
     * Events created by this user in an administrative capacity.
     *
     * @return HasMany<Event>
     */
    public function eventsCreated(): HasMany
    {
        return $this->hasMany(Event::class, 'created_by_id');
    }

    /**
     * Events submitted by this user for approval.
     *
     * @return HasMany<Event>
     */
    public function eventsSubmitted(): HasMany
    {
        return $this->hasMany(Event::class, 'submitted_by_id');
    }

    /**
     * Events this user manages.
     *
     * @return HasMany<Event>
     */
    public function eventsManaged(): HasMany
    {
        return $this->hasMany(Event::class, 'manager_id');
    }

    /**
     * Determine if the user is currently part of the provided circle.
     */
    public function isCircleMember(Circle $circle): bool
    {
        if ($circle->relationLoaded('members')) {
            return $circle->members->contains(fn ($member) => (int) $member->getKey() === (int) $this->getKey());
        }

        return $this->circles()
            ->where('circles.id', $circle->getKey())
            ->exists();
    }

    /**
     * Posts authored by the user.
     *
     * @return HasMany<Post>
     */
    public function postedPosts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    /**
     * Bookmarks created by the user.
     *
     * @return HasMany<Bookmark>
     */
    public function bookmarks(): HasMany
    {
        return $this->hasMany(Bookmark::class);
    }

    /**
     * Posts that the user has bookmarked.
     *
     * @return BelongsToMany<Post>
     */
    public function bookmarkedPosts(): BelongsToMany
    {
        return $this->belongsToMany(
            Post::class,
            'bookmarks',
            'user_id',
            'post_id'
        )
            ->withTimestamps()
            ->withPivot('id')
            ->orderByDesc('bookmarks.created_at');
    }

    /**
     * Attach bookmark status information to the provided bookmarkable models.
     *
     * @param  iterable<Post>|Post|\Illuminate\Contracts\Pagination\Paginator|Collection<int, Post>|array<int, Post>  $bookmarkables
     */
    public function attachBookmarkStatus(
        mixed &$bookmarkables,
        ?callable $resolver = null,
    ): mixed {
        $bookmarks = $this->bookmarks()
            ->select(['id', 'post_id'])
            ->get()
            ->keyBy('post_id');

        $resolver ??= static fn ($model) => $model;

        $attachStatus = static function ($bookmarkable) use ($bookmarks, $resolver) {
            /** @var Post|null $post */
            $post = $resolver($bookmarkable);

            if ($post instanceof Post) {
                $bookmark = $bookmarks->get($post->getKey());
                $post->setAttribute('is_bookmarked', $bookmark !== null);
                $post->setAttribute('bookmark_id', $bookmark?->getKey());
            }

            return $bookmarkable;
        };

        return match (true) {
            $bookmarkables instanceof EloquentModel => $attachStatus($bookmarkables),
            $bookmarkables instanceof Collection => $bookmarkables->each($attachStatus),
            $bookmarkables instanceof LazyCollection => $bookmarkables->map($attachStatus),
            $bookmarkables instanceof AbstractPaginator,
            $bookmarkables instanceof AbstractCursorPaginator => $bookmarkables->through($attachStatus),
            $bookmarkables instanceof Paginator => collect($bookmarkables->items())->transform($attachStatus),
            is_array($bookmarkables) => collect($bookmarkables)->transform($attachStatus),
            default => throw new \InvalidArgumentException('Invalid argument type for attachBookmarkStatus.'),
        };
    }

    /**
     * Timeline entries for the user.
     *
     * @return HasMany<Timeline>
     */
    public function timeline(): HasMany
    {
        return $this->hasMany(Timeline::class);
    }

    /**
     * Post purchases made by the user.
     *
     * @return HasMany<PostPurchase>
     */
    public function purchasedPosts(): HasMany
    {
        return $this->hasMany(PostPurchase::class);
    }

    /**
     * Tips sent by this user.
     *
     * @return HasMany<Tip>
     */
    public function tipsSent(): HasMany
    {
        return $this->hasMany(Tip::class, 'sender_id');
    }

    /**
     * Tips received by this user.
     *
     * @return HasMany<Tip>
     */
    public function tipsReceived(): HasMany
    {
        return $this->hasMany(Tip::class, 'recipient_id');
    }

    public function subscriptionPlans(): HasMany
    {
        return $this->hasMany(SubscriptionPlan::class, 'creator_id');
    }

    public function subscriberSubscriptions(): HasMany
    {
        return $this->hasMany(PaymentSubscription::class, 'subscriber_id');
    }

    public function creatorSubscriptions(): HasMany
    {
        return $this->hasMany(PaymentSubscription::class, 'creator_id');
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(UserMembership::class);
    }

    public function activeMembership(): ?UserMembership
    {
        return $this->memberships()
            ->where('status', 'active')
            ->where(function ($query): void {
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>', now());
            })
            ->latest('starts_at')
            ->first();
    }

    public function subscribers(): BelongsToMany
    {
        return $this->activeSubscriptionRelation('creator_id', 'subscriber_id');
    }

    public function subscribedCreators(): BelongsToMany
    {
        return $this->activeSubscriptionRelation('subscriber_id', 'creator_id');
    }

    protected function activeSubscriptionRelation(string $userColumn, string $relatedColumn): BelongsToMany
    {
        return $this->belongsToMany(
            self::class,
            'payment_subscriptions',
            $userColumn,
            $relatedColumn
        )
            ->withPivot(['status', 'ends_at', 'grace_ends_at'])
            ->wherePivotIn('status', $this->activeSubscriptionStatuses())
            ->where(function ($query): void {
                $query->whereNull('payment_subscriptions.ends_at')
                    ->orWhere('payment_subscriptions.ends_at', '>', Carbon::now());
            })
            ->where(function ($query): void {
                $query->whereNull('payment_subscriptions.grace_ends_at')
                    ->orWhere('payment_subscriptions.grace_ends_at', '>', Carbon::now());
            });
    }

    protected function activeSubscriptionStatuses(): array
    {
        return [
            PaymentSubscriptionStatus::Active->value,
            PaymentSubscriptionStatus::Trialing->value,
            PaymentSubscriptionStatus::Grace->value,
        ];
    }

    /**
     * Wishlist items curated by the user.
     *
     * @return HasMany<WishlistItem>
     */
    public function wishlistItems(): HasMany
    {
        return $this->hasMany(WishlistItem::class, 'creator_id');
    }

    /**
     * Wishlist purchases made by the user.
     *
     * @return HasMany<WishlistPurchase>
     */
    public function wishlistPurchases(): HasMany
    {
        return $this->hasMany(WishlistPurchase::class, 'buyer_id');
    }

    /**
     * Blocks initiated by this user.
     *
     * @return HasMany<UserBlock>
     */
    public function blocks(): HasMany
    {
        return $this->hasMany(UserBlock::class, 'blocker_id');
    }

    /**
     * Users that the current user has blocked.
     *
     * @return BelongsToMany<User>
     */
    public function blockedUsers(): BelongsToMany
    {
        return $this->belongsToMany(
            self::class,
            'user_blocks',
            'blocker_id',
            'blocked_id'
        )->withTimestamps();
    }

    /**
     * Users who have blocked the current user.
     *
     * @return BelongsToMany<User>
     */
    public function blockers(): BelongsToMany
    {
        return $this->belongsToMany(
            self::class,
            'user_blocks',
            'blocked_id',
            'blocker_id'
        )->withTimestamps();
    }

    public function isBlocking(self $user): bool
    {
        if ($this->relationLoaded('blockedUsers')) {
            return $this->getRelation('blockedUsers')->contains(
                fn (self $blocked): bool => $blocked->is($user),
            );
        }

        return $this->blockedUsers()
            ->whereKey($user->getKey())
            ->exists();
    }

    public function isBlockedBy(self $user): bool
    {
        if ($this->relationLoaded('blockers')) {
            return $this->getRelation('blockers')->contains(
                fn (self $blocker): bool => $blocker->is($user),
            );
        }

        return $this->blockers()
            ->whereKey($user->getKey())
            ->exists();
    }

    public function hasBlockRelationshipWith(self $user): bool
    {
        if ($this->is($user)) {
            return false;
        }

        return $this->isBlocking($user) || $this->isBlockedBy($user);
    }

    public function scopeExcludeBlockedFor(Builder $query, ?self $viewer): Builder
    {
        if ($viewer === null) {
            return $query;
        }

        $now = Carbon::now();

        return $query
            ->whereNotIn('users.id', function ($sub) use ($viewer, $now): void {
                $sub->select('blocked_id')
                    ->from('user_blocks')
                    ->where('blocker_id', $viewer->getKey())
                    ->where(function ($expiry) use ($now): void {
                        $expiry->whereNull('expires_at')
                            ->orWhere('expires_at', '>', $now);
                    });
            })
            ->whereNotExists(function ($sub) use ($viewer, $now): void {
                $sub->selectRaw('1')
                    ->from('user_blocks')
                    ->whereColumn('user_blocks.blocker_id', 'users.id')
                    ->where('user_blocks.blocked_id', $viewer->getKey())
                    ->where(function ($expiry) use ($now): void {
                        $expiry->whereNull('expires_at')
                            ->orWhere('expires_at', '>', $now);
                    });
            });
    }

    /**
     * Comments authored by the user.
     *
     * @return HasMany<Comment>
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Conversation memberships for the user.
     *
     * @return HasMany<ConversationParticipant>
     */
    public function conversationParticipants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    /**
     * Conversations the user participates in.
     *
     * @return BelongsToMany<Conversation>
     */
    public function conversations(): BelongsToMany
    {
        return $this->belongsToMany(
            Conversation::class,
            'conversation_participants',
            'user_id',
            'conversation_id'
        )
            ->withPivot([
                'role',
                'is_pinned',
                'is_favorite',
                'last_read_message_id',
                'last_read_at',
                'joined_at',
                'left_at',
                'muted_until',
                'settings',
                'metadata',
            ])
            ->withTimestamps();
    }

    /**
     * Direct message conversations that include the user.
     *
     * @return BelongsToMany<Conversation>
     */
    public function directConversations(): BelongsToMany
    {
        return $this->conversations()
            ->wherePivotNull('left_at')
            ->where('conversations.type', 'direct');
    }

    protected function avatarUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->avatar_path
                ? Storage::disk($this->mediaDisk())->url($this->avatar_path)
                : null,
        );
    }

    protected function coverUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->cover_path
                ? Storage::disk($this->mediaDisk())->url($this->cover_path)
                : null,
        );
    }

    protected function mediaDisk(): string
    {
        return config('filesystems.default');
    }

    /**
     * Determine if the user currently subscribes to the given creator.
     */
    public function subscribesToUser(User $creator): bool
    {
        if ($this->is($creator)) {
            return true;
        }

        /** @var EntitlementService $entitlements */
        $entitlements = app(EntitlementService::class);

        return $entitlements->hasActiveSubscription($this, $creator);
    }

    /**
     * Determine if the user is subscribed by the given member.
     */
    public function isSubscribedByUser(User $subscriber): bool
    {
        if ($this->is($subscriber)) {
            return true;
        }

        /** @var EntitlementService $entitlements */
        $entitlements = app(EntitlementService::class);

        return $entitlements->hasActiveSubscription($subscriber, $this);
    }

    /**
     * Notification preferences for the user.
     *
     * @return HasOne<UserNotificationPreference>
     */
    public function notificationPreferences(): HasOne
    {
        return $this->hasOne(UserNotificationPreference::class);
    }

    /**
     * Data exports for the user.
     *
     * @return HasMany<UserDataExport>
     */
    public function dataExports(): HasMany
    {
        return $this->hasMany(UserDataExport::class);
    }

    /**
     * Verifications for the user.
     *
     * @return HasMany<Verification>
     */
    public function verifications(): HasMany
    {
        return $this->hasMany(Verification::class);
    }

    /**
     * Latest verification for the user.
     *
     * @return HasOne<Verification>
     */
    public function latestVerification(): HasOne
    {
        return $this->hasOne(Verification::class)->latestOfMany();
    }

    /**
     * Check if the user is ID verified.
     */
    public function isIdVerified(): bool
    {
        $latest = $this->latestVerification;

        if ($latest === null) {
            return false;
        }

        return $latest->isApproved() && ! $latest->isExpired();
    }

    /**
     * Check if the user's ID verification is not expired.
     */
    public function idVerificationNotExpired(): bool
    {
        $latest = $this->latestVerification;

        if ($latest === null) {
            return false;
        }

        return ! $latest->isExpired();
    }

    /**
     * Check if the user's ID verification is in grace period.
     */
    public function idVerificationInGracePeriod(): bool
    {
        $latest = $this->latestVerification;

        if ($latest === null) {
            return false;
        }

        return $latest->isInGracePeriod();
    }

    /**
     * Check if the user's creator status is disabled.
     */
    public function isCreatorStatusDisabled(): bool
    {
        return $this->creator_status_disabled_at !== null;
    }

    /**
     * Check if the user can become a creator.
     */
    public function canBecomeCreator(): bool
    {
        return $this->isIdVerified() && $this->idVerificationNotExpired();
    }

    /**
     * Require ID verification renewal for the user.
     */
    public function requireIdVerificationRenewal(?string $note = null): void
    {
        $latest = $this->latestVerification;

        if ($latest === null) {
            return;
        }

        $latest->update([
            'status' => \App\Enums\VerificationStatus::RenewalRequired,
            'renewal_required_at' => now(),
            'compliance_note' => $note,
        ]);
    }

    /**
     * Disable creator status for the user.
     */
    public function disableCreatorStatus(): void
    {
        $this->update(['creator_status_disabled_at' => now()]);

        $latest = $this->latestVerification;

        if ($latest !== null && $latest->creator_status_disabled_at === null) {
            $latest->update(['creator_status_disabled_at' => now()]);
        }
    }
}

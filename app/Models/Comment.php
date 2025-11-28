<?php

namespace App\Models;

use App\Enums\ModerationStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Overtrue\LaravelLike\Traits\Likeable;

class Comment extends Model
{
    /** @use HasFactory<\Database\Factories\CommentFactory> */
    use HasFactory;

    use Likeable;
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'post_id',
        'user_id',
        'parent_id',
        'depth',
        'is_pinned',
        'body',
        'likes_count',
        'replies_count',
        'edited_at',
        'extra_attributes',
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
            'depth' => 'integer',
            'is_pinned' => 'boolean',
            'likes_count' => 'integer',
            'replies_count' => 'integer',
            'edited_at' => 'datetime',
            'deleted_at' => 'datetime',
            'extra_attributes' => 'array',
            'moderation_status' => ModerationStatus::class,
            'moderated_at' => 'datetime',
        ];
    }

    /**
     * Owning post.
     *
     * @return BelongsTo<Post, Comment>
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * Author of the comment.
     *
     * @return BelongsTo<User, Comment>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Parent comment for nested replies.
     *
     * @return BelongsTo<Comment, Comment>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * Child comments (replies).
     *
     * @return HasMany<Comment>
     */
    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('created_at');
    }

    public function isHiddenFor(?User $viewer): bool
    {
        if ($viewer === null) {
            return false;
        }

        $author = $this->relationLoaded('author')
            ? $this->getRelation('author')
            : $this->author;

        return $author instanceof User && $viewer->hasBlockRelationshipWith($author);
    }

    /**
     * Admin who moderated this comment.
     *
     * @return BelongsTo<User, Comment>
     */
    public function moderatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'moderated_by_id');
    }

    /**
     * Moderation queue entry for this comment.
     *
     * @return MorphOne<ContentModerationQueue>
     */
    public function moderationQueue(): MorphOne
    {
        return $this->morphOne(ContentModerationQueue::class, 'moderatable');
    }

    /**
     * Check if the comment is pending moderation.
     */
    public function isPendingModeration(): bool
    {
        return $this->moderation_status === ModerationStatus::Pending;
    }

    /**
     * Check if the comment is approved.
     */
    public function isApproved(): bool
    {
        return $this->moderation_status === ModerationStatus::Approved;
    }

    /**
     * Check if the comment is rejected.
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
     * Approve the comment for moderation.
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
     * Reject the comment for moderation.
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
     * Scope to comments pending moderation.
     *
     * @param  Builder<Comment>  $query
     */
    public function scopePendingModeration(Builder $query): void
    {
        $query->where('moderation_status', ModerationStatus::Pending);
    }

    /**
     * Scope to approved comments.
     *
     * @param  Builder<Comment>  $query
     */
    public function scopeApproved(Builder $query): void
    {
        $query->where('moderation_status', ModerationStatus::Approved);
    }

    /**
     * Scope to rejected comments.
     *
     * @param  Builder<Comment>  $query
     */
    public function scopeRejected(Builder $query): void
    {
        $query->where('moderation_status', ModerationStatus::Rejected);
    }
}

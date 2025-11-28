<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ContentModerationQueue extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'content_moderation_queue';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'moderatable_type',
        'moderatable_id',
        'status',
        'moderated_by_id',
        'moderated_at',
        'moderation_notes',
        'rejection_reason',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'moderated_at' => 'datetime',
        ];
    }

    /**
     * Polymorphic relation to the content being moderated.
     *
     * @return MorphTo<Model, ContentModerationQueue>
     */
    public function moderatable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Admin who moderated the content.
     *
     * @return BelongsTo<User, ContentModerationQueue>
     */
    public function moderatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'moderated_by_id');
    }

    /**
     * Scope to only pending items.
     *
     * @param  Builder<ContentModerationQueue>  $query
     */
    public function scopePending(Builder $query): void
    {
        $query->where('status', 'pending');
    }

    /**
     * Scope to only approved items.
     *
     * @param  Builder<ContentModerationQueue>  $query
     */
    public function scopeApproved(Builder $query): void
    {
        $query->where('status', 'approved');
    }

    /**
     * Scope to only rejected items.
     *
     * @param  Builder<ContentModerationQueue>  $query
     */
    public function scopeRejected(Builder $query): void
    {
        $query->where('status', 'rejected');
    }

    /**
     * Approve the content.
     */
    public function approve(User $moderator, ?string $notes = null): void
    {
        $this->update([
            'status' => 'approved',
            'moderated_by_id' => $moderator->getKey(),
            'moderated_at' => now(),
            'moderation_notes' => $notes,
        ]);
    }

    /**
     * Reject the content.
     */
    public function reject(User $moderator, string $reason, ?string $notes = null): void
    {
        $this->update([
            'status' => 'rejected',
            'moderated_by_id' => $moderator->getKey(),
            'moderated_at' => now(),
            'rejection_reason' => $reason,
            'moderation_notes' => $notes,
        ]);
    }

    /**
     * Dismiss the content from the queue.
     */
    public function dismiss(User $moderator, ?string $notes = null): void
    {
        $this->update([
            'status' => 'dismissed',
            'moderated_by_id' => $moderator->getKey(),
            'moderated_at' => now(),
            'moderation_notes' => $notes,
        ]);
    }
}

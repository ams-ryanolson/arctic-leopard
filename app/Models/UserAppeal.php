<?php

namespace App\Models;

use App\Enums\AppealStatus;
use App\Enums\AppealType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAppeal extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'appeal_type',
        'reason',
        'status',
        'reviewed_by_id',
        'reviewed_at',
        'review_notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'appeal_type' => AppealType::class,
            'status' => AppealStatus::class,
            'reviewed_at' => 'datetime',
        ];
    }

    /**
     * User who submitted the appeal.
     *
     * @return BelongsTo<User, UserAppeal>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Admin who reviewed the appeal.
     *
     * @return BelongsTo<User, UserAppeal>
     */
    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_id');
    }

    /**
     * Scope to only pending appeals.
     *
     * @param  Builder<UserAppeal>  $query
     */
    public function scopePending(Builder $query): void
    {
        $query->where('status', AppealStatus::Pending);
    }

    /**
     * Scope to appeals for suspensions.
     *
     * @param  Builder<UserAppeal>  $query
     */
    public function scopeForSuspension(Builder $query): void
    {
        $query->where('appeal_type', AppealType::Suspension);
    }

    /**
     * Scope to appeals for bans.
     *
     * @param  Builder<UserAppeal>  $query
     */
    public function scopeForBan(Builder $query): void
    {
        $query->where('appeal_type', AppealType::Ban);
    }

    /**
     * Check if the appeal is pending.
     */
    public function isPending(): bool
    {
        return $this->status === AppealStatus::Pending;
    }

    /**
     * Approve the appeal.
     */
    public function approve(User $reviewer, ?string $notes = null): void
    {
        $this->update([
            'status' => AppealStatus::Approved,
            'reviewed_by_id' => $reviewer->getKey(),
            'reviewed_at' => now(),
            'review_notes' => $notes,
        ]);
    }

    /**
     * Reject the appeal.
     */
    public function reject(User $reviewer, ?string $notes = null): void
    {
        $this->update([
            'status' => AppealStatus::Rejected,
            'reviewed_by_id' => $reviewer->getKey(),
            'reviewed_at' => now(),
            'review_notes' => $notes,
        ]);
    }

    /**
     * Dismiss the appeal (e.g., if user was already unsuspended/unbanned).
     */
    public function dismiss(User $reviewer, ?string $notes = null): void
    {
        $this->update([
            'status' => AppealStatus::Dismissed,
            'reviewed_by_id' => $reviewer->getKey(),
            'reviewed_at' => now(),
            'review_notes' => $notes,
        ]);
    }
}

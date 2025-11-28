<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserWarning extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'warned_by_id',
        'reason',
        'notes',
        'expires_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
    }

    /**
     * User who received the warning.
     *
     * @return BelongsTo<User, UserWarning>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Admin who issued the warning.
     *
     * @return BelongsTo<User, UserWarning>
     */
    public function warnedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'warned_by_id');
    }

    /**
     * Scope to only active (non-expired) warnings.
     *
     * @param  Builder<UserWarning>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where(function ($q): void {
            $q->whereNull('expires_at')
                ->orWhere('expires_at', '>', now());
        });
    }

    /**
     * Check if the warning has expired.
     */
    public function isExpired(): bool
    {
        if ($this->expires_at === null) {
            return false;
        }

        return $this->expires_at->isPast();
    }

    /**
     * Get the number of days until the warning expires.
     */
    public function daysUntilExpiry(): ?int
    {
        if ($this->expires_at === null) {
            return null;
        }

        $days = now()->diffInDays($this->expires_at, false);

        return $days > 0 ? $days : 0;
    }
}

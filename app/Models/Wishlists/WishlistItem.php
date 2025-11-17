<?php

namespace App\Models\Wishlists;

use App\Enums\WishlistItemStatus;
use App\Models\Concerns\GeneratesUuid;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class WishlistItem extends Model
{
    use GeneratesUuid;
    use HasFactory;
    use SoftDeletes;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_crowdfunded' => 'boolean',
            'quantity' => 'integer',
            'goal_amount' => 'integer',
            'current_funding' => 'integer',
            'status' => WishlistItemStatus::class,
            'metadata' => 'array',
            'expires_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    protected static function newFactory()
    {
        return \Database\Factories\Wishlists\WishlistItemFactory::new();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(WishlistPurchase::class);
    }

    public function completedPurchases(): HasMany
    {
        return $this->purchases()->where('status', \App\Enums\Payments\WishlistPurchaseStatus::Completed);
    }

    /**
     * Scope a query to only include active items.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', WishlistItemStatus::Active)
            ->where('is_active', true)
            ->whereNull('deleted_at');
    }

    /**
     * Scope a query to only include fulfilled items.
     */
    public function scopeFulfilled(Builder $query): Builder
    {
        return $query->where('status', WishlistItemStatus::Fulfilled)
            ->onlyTrashed();
    }

    /**
     * Scope a query to only include expired items.
     */
    public function scopeExpired(Builder $query): Builder
    {
        return $query->whereNotNull('expires_at')
            ->where('expires_at', '<', now());
    }

    /**
     * Scope a query to only include items pending approval.
     */
    public function scopePendingApproval(Builder $query): Builder
    {
        return $query->whereNull('approved_at')
            ->where('status', WishlistItemStatus::Active);
    }

    /**
     * Get the progress percentage for crowdfunded items.
     */
    public function progressPercentage(): float
    {
        if (! $this->is_crowdfunded || ! $this->goal_amount) {
            return 0.0;
        }

        if ($this->goal_amount === 0) {
            return 0.0;
        }

        return min(100.0, ($this->current_funding / $this->goal_amount) * 100);
    }

    /**
     * Check if the item is fully funded.
     */
    public function isFullyFunded(): bool
    {
        if ($this->is_crowdfunded) {
            return $this->goal_amount !== null && $this->current_funding >= $this->goal_amount;
        }

        return false;
    }

    /**
     * Get the remaining quantity for fixed-price items.
     */
    public function remainingQuantity(): ?int
    {
        if ($this->is_crowdfunded) {
            return null;
        }

        if ($this->quantity === null) {
            return null;
        }

        $purchasedCount = $this->completedPurchases()->count();

        return max(0, $this->quantity - $purchasedCount);
    }

    /**
     * Mark the item as fulfilled.
     */
    public function markAsFulfilled(): bool
    {
        return $this->update([
            'status' => WishlistItemStatus::Fulfilled,
        ]) && $this->delete();
    }

    /**
     * Update the funding amount for crowdfunded items.
     */
    public function updateFunding(int $amount): bool
    {
        if (! $this->is_crowdfunded) {
            return false;
        }

        $this->current_funding += $amount;

        // Auto-mark as fulfilled if goal is reached
        if ($this->current_funding >= $this->goal_amount) {
            $this->status = WishlistItemStatus::Fulfilled;
        }

        return $this->save();
    }

    /**
     * Check if the item can be purchased.
     */
    public function canBePurchased(): bool
    {
        // Must be active and approved (if approval required)
        if ($this->status !== WishlistItemStatus::Active || ! $this->is_active) {
            return false;
        }

        // Check if expired
        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        // For fixed-price items, check quantity
        if (! $this->is_crowdfunded && $this->quantity !== null) {
            return $this->remainingQuantity() > 0;
        }

        // For crowdfunded items, check if goal is reached
        if ($this->is_crowdfunded) {
            return ! $this->isFullyFunded();
        }

        return true;
    }
}

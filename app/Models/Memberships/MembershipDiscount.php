<?php

namespace App\Models\Memberships;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MembershipDiscount extends Model
{
    use HasFactory;

    protected $fillable = [
        'membership_plan_id',
        'code',
        'description',
        'discount_type',
        'discount_value',
        'starts_at',
        'ends_at',
        'max_uses',
        'used_count',
        'is_active',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(MembershipPlan::class);
    }

    public function isValid(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $now = now();

        if ($this->starts_at->isFuture() || $this->ends_at->isPast()) {
            return false;
        }

        if ($this->max_uses !== null && $this->used_count >= $this->max_uses) {
            return false;
        }

        return true;
    }

    public function calculateDiscount(int $price): int
    {
        if ($this->discount_type === 'percentage') {
            return (int) round($price * ($this->discount_value / 100));
        }

        // fixed_amount
        return min($this->discount_value, $price);
    }

    public function canBeUsed(): bool
    {
        return $this->isValid() && ($this->max_uses === null || $this->used_count < $this->max_uses);
    }
}

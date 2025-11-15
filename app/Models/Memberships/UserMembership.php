<?php

namespace App\Models\Memberships;

use App\Models\Concerns\GeneratesUuid;
use App\Models\Payments\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserMembership extends Model
{
    use GeneratesUuid;
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'membership_plan_id',
        'status',
        'billing_type',
        'starts_at',
        'ends_at',
        'next_billing_at',
        'cancelled_at',
        'cancellation_reason',
        'payment_id',
        'original_price',
        'discount_amount',
        'metadata',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'next_billing_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'metadata' => 'array',
        'deleted_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(MembershipPlan::class, 'membership_plan_id');
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'expired');
    }

    public function scopeRecurring($query)
    {
        return $query->where('billing_type', 'recurring');
    }

    public function scopeOneTime($query)
    {
        return $query->where('billing_type', 'one_time');
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && ($this->ends_at === null || $this->ends_at->isFuture());
    }

    public function isExpired(): bool
    {
        return $this->status === 'expired' || ($this->ends_at !== null && $this->ends_at->isPast());
    }

    public function daysRemaining(): int
    {
        if ($this->ends_at === null) {
            return 0;
        }

        return max(0, now()->diffInDays($this->ends_at, false));
    }

    public function canUpgrade(): bool
    {
        return $this->isActive() && $this->status !== 'cancelled';
    }
}

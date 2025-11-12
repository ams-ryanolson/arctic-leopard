<?php

namespace App\Models\Payments;

use App\Enums\Payments\PaymentSubscriptionStatus;
use App\Models\Concerns\GeneratesUuid;
use App\Models\Payments\Concerns\InteractsWithMoney;
use App\Models\User;
use App\ValueObjects\Money;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PaymentSubscription extends Model
{
    use GeneratesUuid;
    use HasFactory;
    use InteractsWithMoney;
    use SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'status' => PaymentSubscriptionStatus::class,
        'auto_renews' => 'boolean',
        'metadata' => 'array',
        'trial_ends_at' => 'datetime',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'grace_ends_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'last_synced_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected static function newFactory()
    {
        return \Database\Factories\Payments\PaymentSubscriptionFactory::new();
    }

    public function subscriber(): BelongsTo
    {
        return $this->belongsTo(User::class, 'subscriber_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function payments(): MorphMany
    {
        return $this->morphMany(Payment::class, 'payable');
    }

    public function amountMoney(): Money
    {
        return $this->money($this->amount);
    }

    public function isActive(): bool
    {
        return $this->status === PaymentSubscriptionStatus::Active;
    }

    public function isPastDue(): bool
    {
        return in_array($this->status, [
            PaymentSubscriptionStatus::PastDue,
            PaymentSubscriptionStatus::Grace,
        ], true);
    }
}


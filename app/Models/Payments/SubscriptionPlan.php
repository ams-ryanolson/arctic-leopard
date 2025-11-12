<?php

namespace App\Models\Payments;

use App\Models\Concerns\GeneratesUuid;
use App\Models\Payments\Concerns\InteractsWithMoney;
use App\Models\User;
use App\ValueObjects\Money;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SubscriptionPlan extends Model
{
    use GeneratesUuid;
    use HasFactory;
    use InteractsWithMoney;
    use SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'metadata' => 'array',
        'is_active' => 'boolean',
        'is_public' => 'boolean',
        'deleted_at' => 'datetime',
    ];

    protected static function newFactory()
    {
        return \Database\Factories\Payments\SubscriptionPlanFactory::new();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function features(): HasMany
    {
        return $this->hasMany(SubscriptionPlanFeature::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(PaymentSubscription::class);
    }

    public function amountMoney(): Money
    {
        return $this->money($this->amount);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }
}


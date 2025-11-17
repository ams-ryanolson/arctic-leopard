<?php

namespace App\Models\Payments;

use App\Enums\Payments\PaymentMethodStatus;
use App\Models\Concerns\GeneratesUuid;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PaymentMethod extends Model
{
    use GeneratesUuid;
    use HasFactory;
    use SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'billing_address' => 'array',
        'metadata' => 'array',
        'expires_at' => 'datetime',
        'last_used_at' => 'datetime',
        'status' => PaymentMethodStatus::class,
        'deleted_at' => 'datetime',
    ];

    protected static function newFactory()
    {
        return \Database\Factories\Payments\PaymentMethodFactory::new();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(PaymentSubscription::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', PaymentMethodStatus::Active);
    }
}

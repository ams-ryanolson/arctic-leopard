<?php

namespace App\Models\Payments;

use App\Enums\Payments\PaymentIntentStatus;
use App\Enums\Payments\PaymentType;
use App\Models\Concerns\GeneratesUuid;
use App\Models\Payments\Concerns\HasPayable;
use App\Models\Payments\Concerns\InteractsWithMoney;
use App\Models\User;
use App\ValueObjects\Money;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PaymentIntent extends Model
{
    use GeneratesUuid;
    use HasFactory;
    use HasPayable;
    use InteractsWithMoney;

    protected $guarded = [];

    protected $casts = [
        'status' => PaymentIntentStatus::class,
        'type' => PaymentType::class,
        'metadata' => 'array',
        'expires_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    protected static function newFactory()
    {
        return \Database\Factories\Payments\PaymentIntentFactory::new();
    }

    public function payer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payer_id');
    }

    public function payee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payee_id');
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function latestPayment(): HasOne
    {
        return $this->hasOne(Payment::class)->latestOfMany();
    }

    public function amountMoney(): Money
    {
        return $this->money($this->amount);
    }
}


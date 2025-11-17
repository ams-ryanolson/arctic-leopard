<?php

namespace App\Models\Payments;

use App\Enums\Payments\PaymentRefundStatus;
use App\Models\Concerns\GeneratesUuid;
use App\Models\Payments\Concerns\InteractsWithMoney;
use App\ValueObjects\Money;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentRefund extends Model
{
    use GeneratesUuid;
    use HasFactory;
    use InteractsWithMoney;

    protected $guarded = [];

    protected $casts = [
        'status' => PaymentRefundStatus::class,
        'metadata' => 'array',
        'processed_at' => 'datetime',
    ];

    protected static function newFactory()
    {
        return \Database\Factories\Payments\PaymentRefundFactory::new();
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function amountMoney(): Money
    {
        return $this->money($this->amount);
    }
}

<?php

namespace App\Models\Payments;

use App\Enums\Payments\WalletTransactionType;
use App\Models\Concerns\GeneratesUuid;
use App\Models\Payments\Concerns\InteractsWithMoney;
use App\Models\User;
use App\ValueObjects\Money;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class WalletTransaction extends Model
{
    use GeneratesUuid;
    use HasFactory;
    use InteractsWithMoney;

    protected $guarded = [];

    protected $casts = [
        'type' => WalletTransactionType::class,
        'metadata' => 'array',
        'occurred_at' => 'datetime',
    ];

    protected static function newFactory()
    {
        return \Database\Factories\Payments\WalletTransactionFactory::new();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    public function amountMoney(): Money
    {
        return $this->money($this->amount);
    }

    public function balanceMoney(): ?Money
    {
        $balance = $this->balance_after;

        if ($balance === null) {
            return null;
        }

        return $this->money($balance);
    }
}


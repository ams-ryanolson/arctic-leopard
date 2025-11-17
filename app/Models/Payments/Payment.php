<?php

namespace App\Models\Payments;

use App\Enums\Payments\PaymentStatus;
use App\Enums\Payments\PaymentType;
use App\Models\Concerns\GeneratesUuid;
use App\Models\Payments\Concerns\HasPayable;
use App\Models\Payments\Concerns\InteractsWithMoney;
use App\Models\User;
use App\ValueObjects\Money;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use GeneratesUuid;
    use HasFactory;
    use HasPayable;
    use InteractsWithMoney;
    use SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'type' => PaymentType::class,
        'status' => PaymentStatus::class,
        'metadata' => 'array',
        'authorized_at' => 'datetime',
        'captured_at' => 'datetime',
        'succeeded_at' => 'datetime',
        'refunded_at' => 'datetime',
        'expires_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Override factory resolution for the Payments namespace.
     */
    protected static function newFactory()
    {
        return \Database\Factories\Payments\PaymentFactory::new();
    }

    public function payer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payer_id');
    }

    public function payee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payee_id');
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PaymentItem::class);
    }

    public function intents(): HasMany
    {
        return $this->hasMany(PaymentIntent::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(PaymentRefund::class);
    }

    public function walletTransactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(LedgerEntry::class);
    }

    public function amountMoney(): Money
    {
        return $this->money($this->amount);
    }

    public function feeMoney(): Money
    {
        return $this->money($this->fee_amount);
    }

    public function netMoney(): Money
    {
        return $this->money($this->net_amount);
    }

    public function isSuccessful(): bool
    {
        return in_array($this->status, [
            PaymentStatus::Captured,
            PaymentStatus::Settled,
            PaymentStatus::Refunded,
        ], true);
    }

    public function isRefunded(): bool
    {
        return $this->status === PaymentStatus::Refunded;
    }

    public function scopeForProvider($query, string $provider)
    {
        return $query->where('provider', $provider);
    }

    public function scopeForPayable($query, Model $payable)
    {
        return $query->where('payable_type', $payable->getMorphClass())
            ->where('payable_id', $payable->getKey());
    }
}

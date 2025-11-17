<?php

namespace App\Models\Payments;

use App\Enums\Payments\PaymentGatewayStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PaymentGatewayConfig extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'is_default' => 'boolean',
        'settings' => 'array',
        'last_synced_at' => 'datetime',
        'status' => PaymentGatewayStatus::class,
    ];

    protected static function newFactory()
    {
        return \Database\Factories\Payments\PaymentGatewayConfigFactory::new();
    }

    public function configurable(): MorphTo
    {
        return $this->morphTo();
    }

    public function scopeActive($query)
    {
        return $query->where('status', PaymentGatewayStatus::Active);
    }
}

<?php

namespace App\Models\Payments;

use App\Enums\Payments\PaymentWebhookStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentWebhook extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'headers' => 'array',
        'payload' => 'array',
        'received_at' => 'datetime',
        'processed_at' => 'datetime',
        'status' => PaymentWebhookStatus::class,
    ];

    protected static function newFactory()
    {
        return \Database\Factories\Payments\PaymentWebhookFactory::new();
    }

    public function scopePending($query)
    {
        return $query->where('status', PaymentWebhookStatus::Pending);
    }
}

<?php

namespace App\Models;

use App\Enums\Payments\PostPurchaseStatus;
use App\Models\Concerns\GeneratesUuid;
use App\Models\Payments\Payment;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostPurchase extends Model
{
    use GeneratesUuid;
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'status' => PostPurchaseStatus::class,
        'expires_at' => 'datetime',
        'fulfilled_at' => 'datetime',
        'metadata' => 'array',
        'amount' => 'integer',
    ];

    protected static function newFactory()
    {
        return \Database\Factories\PostPurchaseFactory::new();
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}



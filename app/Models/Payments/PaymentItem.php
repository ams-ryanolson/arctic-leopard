<?php

namespace App\Models\Payments;

use App\Models\Payments\Concerns\HasPayable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentItem extends Model
{
    use HasFactory;
    use HasPayable;

    public $timestamps = true;

    protected $guarded = [];

    protected $casts = [
        'metadata' => 'array',
    ];

    protected static function newFactory()
    {
        return \Database\Factories\Payments\PaymentItemFactory::new();
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}


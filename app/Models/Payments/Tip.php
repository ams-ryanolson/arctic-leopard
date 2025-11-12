<?php

namespace App\Models\Payments;

use App\Enums\Payments\TipStatus;
use App\Models\Concerns\GeneratesUuid;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tip extends Model
{
    use GeneratesUuid;
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'status' => TipStatus::class,
        'metadata' => 'array',
    ];

    protected static function newFactory()
    {
        return \Database\Factories\Payments\TipFactory::new();
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }
}


<?php

namespace App\Models;

use App\Enums\LiveStreamTipStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiveStreamTip extends Model
{
    use HasFactory;

    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'stream_id',
        'sender_id',
        'recipient_id',
        'amount',
        'currency',
        'message',
        'status',
        'payment_id',
        'created_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'status' => LiveStreamTipStatus::class,
            'created_at' => 'datetime',
        ];
    }

    /**
     * Stream this tip was given during.
     *
     * @return BelongsTo<LiveStream, LiveStreamTip>
     */
    public function stream(): BelongsTo
    {
        return $this->belongsTo(LiveStream::class, 'stream_id');
    }

    /**
     * User who sent the tip.
     *
     * @return BelongsTo<User, LiveStreamTip>
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * User who received the tip.
     *
     * @return BelongsTo<User, LiveStreamTip>
     */
    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    /**
     * Payment associated with this tip.
     *
     * @return BelongsTo<\App\Models\Payments\Payment, LiveStreamTip>
     */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Payments\Payment::class, 'payment_id');
    }
}

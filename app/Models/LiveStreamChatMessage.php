<?php

namespace App\Models;

use App\Enums\LiveStreamChatMessageType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiveStreamChatMessage extends Model
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
        'user_id',
        'message',
        'message_type',
        'tip_amount',
        'tip_recipient_id',
        'is_deleted',
        'deleted_by_id',
        'created_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'message_type' => LiveStreamChatMessageType::class,
            'tip_amount' => 'integer',
            'is_deleted' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    /**
     * Stream this message belongs to.
     *
     * @return BelongsTo<LiveStream, LiveStreamChatMessage>
     */
    public function stream(): BelongsTo
    {
        return $this->belongsTo(LiveStream::class, 'stream_id');
    }

    /**
     * User who sent the message.
     *
     * @return BelongsTo<User, LiveStreamChatMessage>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * User who received the tip (if message is a tip).
     *
     * @return BelongsTo<User, LiveStreamChatMessage>
     */
    public function tipRecipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tip_recipient_id');
    }

    /**
     * User who deleted the message.
     *
     * @return BelongsTo<User, LiveStreamChatMessage>
     */
    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by_id');
    }

    /**
     * Scope to only visible (non-deleted) messages.
     *
     * @param  Builder<LiveStreamChatMessage>  $query
     */
    public function scopeVisible(Builder $query): void
    {
        $query->where('is_deleted', false);
    }

    /**
     * Scope to only tip messages.
     *
     * @param  Builder<LiveStreamChatMessage>  $query
     */
    public function scopeTips(Builder $query): void
    {
        $query->where('message_type', LiveStreamChatMessageType::Tip->value);
    }

    /**
     * Scope to only system messages.
     *
     * @param  Builder<LiveStreamChatMessage>  $query
     */
    public function scopeSystemMessages(Builder $query): void
    {
        $query->where('message_type', LiveStreamChatMessageType::System->value);
    }
}

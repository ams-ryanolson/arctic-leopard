<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageReaction extends Model
{
    /** @use HasFactory<\Database\Factories\MessageReactionFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'message_id',
        'user_id',
        'emoji',
        'variant',
        'metadata',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    /**
     * Message the reaction belongs to.
     *
     * @return BelongsTo<Message, MessageReaction>
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    /**
     * User who created the reaction.
     *
     * @return BelongsTo<User, MessageReaction>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope reactions for a specific emoji representation.
     *
     * @param  Builder<MessageReaction>  $query
     */
    public function scopeForEmoji(Builder $query, string $emoji): Builder
    {
        return $query->where('emoji', $emoji);
    }
}

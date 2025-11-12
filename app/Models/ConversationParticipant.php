<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class ConversationParticipant extends Model
{
    /** @use HasFactory<\Database\Factories\ConversationParticipantFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'conversation_id',
        'user_id',
        'role',
        'is_pinned',
        'is_favorite',
        'last_read_message_id',
        'last_read_at',
        'joined_at',
        'left_at',
        'muted_until',
        'settings',
        'metadata',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_pinned' => 'bool',
            'is_favorite' => 'bool',
            'last_read_message_id' => 'integer',
            'last_read_at' => 'datetime',
            'joined_at' => 'datetime',
            'left_at' => 'datetime',
            'muted_until' => 'datetime',
            'settings' => 'array',
            'metadata' => 'array',
        ];
    }

    /**
     * Conversation the participant belongs to.
     *
     * @return BelongsTo<Conversation, ConversationParticipant>
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Participant user profile.
     *
     * @return BelongsTo<User, ConversationParticipant>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Last read message reference.
     *
     * @return BelongsTo<Message, ConversationParticipant>
     */
    public function lastReadMessage(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'last_read_message_id');
    }

    public function isModerator(): bool
    {
        return in_array($this->role, ['moderator', 'owner'], true);
    }

    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    public function isActive(): bool
    {
        return $this->left_at === null;
    }

    public function isMuted(): bool
    {
        return $this->muted_until instanceof Carbon && $this->muted_until->isFuture();
    }

    /**
     * Scope only active participants.
     *
     * @param  Builder<ConversationParticipant>  $query
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('left_at');
    }

    /**
     * Scope participants that joined before the given timestamp.
     *
     * @param  Builder<ConversationParticipant>  $query
     */
    public function scopeJoinedBefore(Builder $query, Carbon $timestamp): Builder
    {
        return $query->where('joined_at', '<=', $timestamp);
    }
}

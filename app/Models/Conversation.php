<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class Conversation extends Model
{
    /** @use HasFactory<\Database\Factories\ConversationFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'ulid',
        'type',
        'subject',
        'creator_id',
        'participant_count',
        'message_count',
        'last_message_id',
        'last_message_at',
        'archived_at',
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
            'participant_count' => 'integer',
            'message_count' => 'integer',
            'last_message_at' => 'datetime',
            'archived_at' => 'datetime',
            'muted_until' => 'datetime',
            'settings' => 'array',
            'metadata' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $conversation): void {
            $conversation->ulid ??= (string) Str::ulid();
        });
    }

    /**
     * Creator who opened the conversation.
     *
     * @return BelongsTo<User, Conversation>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    /**
     * Participants of the conversation.
     *
     * @return HasMany<ConversationParticipant>
     */
    public function participants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    /**
     * Messages posted in the conversation.
     *
     * @return HasMany<Message>
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * The most recent message metadata.
     *
     * @return BelongsTo<Message, Conversation>
     */
    public function lastMessage(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'last_message_id');
    }

    public function isGroup(): bool
    {
        return $this->type === 'group';
    }

    public function isDirect(): bool
    {
        return $this->type === 'direct';
    }

    public function isSystem(): bool
    {
        return $this->type === 'system';
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    public function isMuted(): bool
    {
        return $this->muted_until instanceof Carbon
            ? $this->muted_until->isFuture()
            : false;
    }

    /**
     * Scope conversations by type.
     *
     * @param  Builder<Conversation>  $query
     */
    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    /**
     * Scope conversations updated after the provided timestamp.
     *
     * @param  Builder<Conversation>  $query
     */
    public function scopeUpdatedSince(Builder $query, Carbon $since): Builder
    {
        return $query->where('updated_at', '>=', $since);
    }
}

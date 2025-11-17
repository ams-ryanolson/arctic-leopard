<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class Message extends Model
{
    /** @use HasFactory<\Database\Factories\MessageFactory> */
    use HasFactory;

    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'ulid',
        'conversation_id',
        'user_id',
        'reply_to_id',
        'deleted_by_id',
        'type',
        'sequence',
        'body',
        'fragments',
        'metadata',
        'visible_at',
        'edited_at',
        'redacted_at',
        'undo_expires_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sequence' => 'integer',
            'fragments' => 'array',
            'metadata' => 'array',
            'visible_at' => 'datetime',
            'edited_at' => 'datetime',
            'redacted_at' => 'datetime',
            'undo_expires_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $message): void {
            $message->ulid ??= (string) Str::ulid();

            if ($message->sequence === null) {
                $message->sequence = (int) round(microtime(true) * 1_000);
            }
        });
    }

    /**
     * Conversation this message belongs to.
     *
     * @return BelongsTo<Conversation, Message>
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Author of the message.
     *
     * @return BelongsTo<User, Message>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Message this replies to.
     *
     * @return BelongsTo<Message, Message>
     */
    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reply_to_id');
    }

    /**
     * Messages that reply to this message.
     *
     * @return HasMany<Message>
     */
    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'reply_to_id');
    }

    /**
     * Attachments associated with the message.
     *
     * @return HasMany<MessageAttachment>
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(MessageAttachment::class);
    }

    /**
     * Reactions applied to the message.
     *
     * @return HasMany<MessageReaction>
     */
    public function reactions(): HasMany
    {
        return $this->hasMany(MessageReaction::class);
    }

    /**
     * User who removed or redacted the message.
     *
     * @return BelongsTo<User, Message>
     */
    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by_id');
    }

    public function isVisible(): bool
    {
        if ($this->visible_at instanceof Carbon) {
            return $this->visible_at->isPast();
        }

        return true;
    }

    public function isUndoable(): bool
    {
        return $this->undo_expires_at instanceof Carbon
            ? $this->undo_expires_at->isFuture()
            : false;
    }

    /**
     * Scope visible messages.
     *
     * @param  Builder<Message>  $query
     */
    public function scopeVisible(Builder $query): Builder
    {
        return $query->where(function (Builder $builder): void {
            $builder->whereNull('visible_at')
                ->orWhere('visible_at', '<=', Carbon::now());
        });
    }

    /**
     * Scope messages ordered newest first.
     *
     * @param  Builder<Message>  $query
     */
    public function scopeLatestFirst(Builder $query): Builder
    {
        return $query->orderByDesc('sequence');
    }
}

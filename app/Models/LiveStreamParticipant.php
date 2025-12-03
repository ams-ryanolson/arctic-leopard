<?php

namespace App\Models;

use App\Enums\LiveStreamParticipantRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiveStreamParticipant extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'stream_id',
        'user_id',
        'role',
        'joined_at',
        'left_at',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'role' => LiveStreamParticipantRole::class,
            'joined_at' => 'datetime',
            'left_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Stream this participant belongs to.
     *
     * @return BelongsTo<LiveStream, LiveStreamParticipant>
     */
    public function stream(): BelongsTo
    {
        return $this->belongsTo(LiveStream::class, 'stream_id');
    }

    /**
     * User who is participating.
     *
     * @return BelongsTo<User, LiveStreamParticipant>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Promote this participant to co-host.
     */
    public function promoteToCoHost(): bool
    {
        return $this->update([
            'role' => LiveStreamParticipantRole::CoHost,
        ]);
    }

    /**
     * Demote this participant from co-host.
     */
    public function demoteFromCoHost(): bool
    {
        return $this->update([
            'role' => LiveStreamParticipantRole::Guest,
        ]);
    }

    /**
     * Kick this participant from the stream.
     */
    public function kick(): bool
    {
        return $this->update([
            'is_active' => false,
            'left_at' => now(),
        ]);
    }
}

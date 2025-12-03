<?php

namespace App\Models;

use App\Enums\LiveStreamCategory;
use App\Enums\LiveStreamStatus;
use App\Enums\LiveStreamVisibility;
use App\Models\Concerns\GeneratesUuid;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class LiveStream extends Model
{
    use GeneratesUuid;
    use HasFactory;
    use SoftDeletes;

    protected static function booted(): void
    {
        static::creating(function (LiveStream $stream): void {
            if (blank($stream->stream_key)) {
                $stream->stream_key = Str::uuid()->toString();
            }

            if (blank($stream->rtmp_url)) {
                $stream->rtmp_url = 'rtmp://mock-server.example.com/stream/'.$stream->stream_key;
            }
        });
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'uuid',
        'user_id',
        'title',
        'description',
        'category',
        'visibility',
        'status',
        'stream_key',
        'rtmp_url',
        'viewer_count',
        'started_at',
        'ended_at',
        'scheduled_start_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'category' => LiveStreamCategory::class,
            'visibility' => LiveStreamVisibility::class,
            'status' => LiveStreamStatus::class,
            'viewer_count' => 'integer',
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'scheduled_start_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * Host/user who owns this stream.
     *
     * @return BelongsTo<User, LiveStream>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Participants in the stream.
     *
     * @return HasMany<LiveStreamParticipant>
     */
    public function participants(): HasMany
    {
        return $this->hasMany(LiveStreamParticipant::class, 'stream_id');
    }

    /**
     * Active participants on stage.
     *
     * @return HasMany<LiveStreamParticipant>
     */
    public function activeParticipants(): HasMany
    {
        return $this->participants()->where('is_active', true);
    }

    /**
     * Moderators for this stream.
     *
     * @return HasMany<LiveStreamModerator>
     */
    public function moderators(): HasMany
    {
        return $this->hasMany(LiveStreamModerator::class, 'stream_id');
    }

    /**
     * Chat messages in the stream.
     *
     * @return HasMany<LiveStreamChatMessage>
     */
    public function chatMessages(): HasMany
    {
        return $this->hasMany(LiveStreamChatMessage::class, 'stream_id');
    }

    /**
     * Tips received during the stream.
     *
     * @return HasMany<LiveStreamTip>
     */
    public function tips(): HasMany
    {
        return $this->hasMany(LiveStreamTip::class, 'stream_id');
    }

    /**
     * Scope to only live streams.
     *
     * @param  Builder<LiveStream>  $query
     */
    public function scopeLive(Builder $query): void
    {
        $query->where('status', LiveStreamStatus::Live->value);
    }

    /**
     * Scope to only scheduled streams.
     *
     * @param  Builder<LiveStream>  $query
     */
    public function scopeScheduled(Builder $query): void
    {
        $query->where('status', LiveStreamStatus::Scheduled->value);
    }

    /**
     * Scope to only ended streams.
     *
     * @param  Builder<LiveStream>  $query
     */
    public function scopeEnded(Builder $query): void
    {
        $query->where('status', LiveStreamStatus::Ended->value);
    }

    /**
     * Scope to only public streams.
     *
     * @param  Builder<LiveStream>  $query
     */
    public function scopePublic(Builder $query): void
    {
        $query->where('visibility', LiveStreamVisibility::Public->value);
    }

    /**
     * Scope to streams for followers only.
     *
     * @param  Builder<LiveStream>  $query
     */
    public function scopeForFollowers(Builder $query): void
    {
        $query->where('visibility', LiveStreamVisibility::Followers->value);
    }

    /**
     * Scope to streams for subscribers only.
     *
     * @param  Builder<LiveStream>  $query
     */
    public function scopeForSubscribers(Builder $query): void
    {
        $query->where('visibility', LiveStreamVisibility::Subscribers->value);
    }

    /**
     * Check if the stream is currently live.
     */
    public function isLive(): bool
    {
        return $this->status === LiveStreamStatus::Live;
    }

    /**
     * Check if a user can join this stream.
     */
    public function canJoin(?User $user): bool
    {
        if ($user === null) {
            return $this->visibility === LiveStreamVisibility::Public;
        }

        if ($user->id === $this->user_id) {
            return true;
        }

        return match ($this->visibility) {
            LiveStreamVisibility::Public => true,
            LiveStreamVisibility::Followers => $user->isFollowing($this->user),
            LiveStreamVisibility::Subscribers => $user->subscribesToUser($this->user),
        };
    }

    /**
     * Check if a user can moderate this stream.
     */
    public function canModerate(?User $user): bool
    {
        if ($user === null) {
            return false;
        }

        if ($user->id === $this->user_id) {
            return true;
        }

        return $this->moderators()->where('user_id', $user->id)->exists();
    }

    /**
     * Generate a unique stream key.
     */
    public function generateStreamKey(): string
    {
        return Str::uuid()->toString();
    }

    /**
     * Generate RTMP URL for the stream key.
     */
    public function generateRtmpUrl(): string
    {
        return 'rtmp://mock-server.example.com/stream/'.$this->stream_key;
    }
}

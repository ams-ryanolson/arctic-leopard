<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PostPollOption extends Model
{
    /** @use HasFactory<\Database\Factories\PostPollOptionFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'post_poll_id',
        'title',
        'position',
        'vote_count',
        'meta',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'vote_count' => 'integer',
            'meta' => 'array',
        ];
    }

    /**
     * Parent poll.
     *
     * @return BelongsTo<PostPoll, PostPollOption>
     */
    public function poll(): BelongsTo
    {
        return $this->belongsTo(PostPoll::class, 'post_poll_id');
    }

    /**
     * Votes credited to this option.
     *
     * @return HasMany<PostPollVote>
     */
    public function votes(): HasMany
    {
        return $this->hasMany(PostPollVote::class, 'post_poll_option_id');
    }
}

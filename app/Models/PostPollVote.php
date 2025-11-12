<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostPollVote extends Model
{
    /** @use HasFactory<\Database\Factories\PostPollVoteFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'post_poll_id',
        'post_poll_option_id',
        'user_id',
        'ip_address',
        'meta',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'meta' => 'array',
        ];
    }

    /**
     * Poll this vote belongs to.
     *
     * @return BelongsTo<PostPoll, PostPollVote>
     */
    public function poll(): BelongsTo
    {
        return $this->belongsTo(PostPoll::class);
    }

    /**
     * Option selected by this vote.
     *
     * @return BelongsTo<PostPollOption, PostPollVote>
     */
    public function option(): BelongsTo
    {
        return $this->belongsTo(PostPollOption::class, 'post_poll_option_id');
    }

    /**
     * User who cast the vote.
     *
     * @return BelongsTo<User, PostPollVote>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PostPoll extends Model
{
    /** @use HasFactory<\Database\Factories\PostPollFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'post_id',
        'question',
        'allow_multiple',
        'max_choices',
        'closes_at',
        'meta',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'allow_multiple' => 'boolean',
            'max_choices' => 'integer',
            'closes_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    /**
     * Owning post.
     *
     * @return BelongsTo<Post, PostPoll>
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * Options available for this poll.
     *
     * @return HasMany<PostPollOption>
     */
    public function options(): HasMany
    {
        return $this->hasMany(PostPollOption::class)->orderBy('position');
    }

    /**
     * Votes cast for this poll.
     *
     * @return HasMany<PostPollVote>
     */
    public function votes(): HasMany
    {
        return $this->hasMany(PostPollVote::class);
    }
}

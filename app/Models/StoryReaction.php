<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoryReaction extends Model
{
    /** @use HasFactory<\Database\Factories\StoryReactionFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'story_id',
        'user_id',
        'emoji',
    ];

    /**
     * Story the reaction belongs to.
     *
     * @return BelongsTo<Story, StoryReaction>
     */
    public function story(): BelongsTo
    {
        return $this->belongsTo(Story::class);
    }

    /**
     * User who created the reaction.
     *
     * @return BelongsTo<User, StoryReaction>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope reactions for a specific emoji.
     *
     * @param  Builder<StoryReaction>  $query
     * @return Builder<StoryReaction>
     */
    public function scopeForEmoji(Builder $query, string $emoji): Builder
    {
        return $query->where('emoji', $emoji);
    }
}

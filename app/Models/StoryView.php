<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoryView extends Model
{
    /** @use HasFactory<\Database\Factories\StoryViewFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'story_id',
        'user_id',
        'viewed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'viewed_at' => 'datetime',
        ];
    }

    /**
     * Story that was viewed.
     *
     * @return BelongsTo<Story, StoryView>
     */
    public function story(): BelongsTo
    {
        return $this->belongsTo(Story::class);
    }

    /**
     * User who viewed the story.
     *
     * @return BelongsTo<User, StoryView>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope recent views.
     *
     * @param  Builder<StoryView>  $query
     * @return Builder<StoryView>
     */
    public function scopeRecent(Builder $query): Builder
    {
        return $query->orderByDesc('viewed_at');
    }
}

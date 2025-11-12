<?php

namespace App\Models;

use App\Enums\TimelineVisibilitySource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class Timeline extends Model
{
    /** @use HasFactory<\Database\Factories\TimelineFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'post_id',
        'visibility_source',
        'context',
        'visible_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'visibility_source' => TimelineVisibilitySource::class,
            'context' => 'array',
            'visible_at' => 'datetime',
        ];
    }

    /**
     * Timeline owner.
     *
     * @return BelongsTo<User, Timeline>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Post entry refers to.
     *
     * @return BelongsTo<Post, Timeline>
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * Scope entries for a specific viewer, excluding blocked content.
     *
     * @param  Builder<Timeline>  $query
     * @return Builder<Timeline>
     */
    public function scopeForViewer(Builder $query, User $viewer): Builder
    {
        return $query->where('user_id', $viewer->getKey())
            ->whereHas('post', fn (Builder $postQuery) => $postQuery->visibleTo($viewer));
    }

    /**
     * Scope timeline entries that are visible as of now.
     *
     * @param  Builder<Timeline>  $query
     * @return Builder<Timeline>
     */
    public function scopeVisible(Builder $query): Builder
    {
        return $query->where(function (Builder $builder): void {
            $builder->whereNull('visible_at')->orWhere('visible_at', '<=', Carbon::now());
        });
    }
}

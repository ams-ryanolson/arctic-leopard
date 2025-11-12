<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostMetricDaily extends Model
{
    /** @use HasFactory<\Database\Factories\PostMetricDailyFactory> */
    use HasFactory;

    protected $table = 'post_metrics_daily';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'post_id',
        'date',
        'likes',
        'comments',
        'reposts',
        'poll_votes',
        'views',
        'purchases',
        'unique_viewers',
        'unique_authenticated_viewers',
        'unique_guest_viewers',
        'country_breakdown',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'likes' => 'integer',
            'comments' => 'integer',
            'reposts' => 'integer',
            'poll_votes' => 'integer',
            'views' => 'integer',
            'purchases' => 'integer',
            'unique_viewers' => 'integer',
            'unique_authenticated_viewers' => 'integer',
            'unique_guest_viewers' => 'integer',
            'country_breakdown' => 'array',
        ];
    }

    /**
     * Associated post.
     *
     * @return BelongsTo<Post, PostMetricDaily>
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}

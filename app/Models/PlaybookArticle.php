<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Overtrue\LaravelLike\Traits\Likeable;

class PlaybookArticle extends Model
{
    /** @use HasFactory<\Database\Factories\PlaybookArticleFactory> */
    use HasFactory;
    use Likeable;
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'slug',
        'title',
        'excerpt',
        'content',
        'header_image_url',
        'category',
        'read_time_minutes',
        'likes_count',
        'views_count',
        'order',
        'is_published',
        'published_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'read_time_minutes' => 'integer',
            'likes_count' => 'integer',
            'views_count' => 'integer',
            'order' => 'integer',
            'is_published' => 'boolean',
            'published_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Get the formatted read time attribute.
     */
    public function getReadTimeAttribute(): string
    {
        return $this->read_time_minutes.' min read';
    }
}

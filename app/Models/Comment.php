<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Overtrue\LaravelLike\Traits\Likeable;

class Comment extends Model
{
    /** @use HasFactory<\Database\Factories\CommentFactory> */
    use HasFactory;
    use SoftDeletes;
    use Likeable;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'post_id',
        'user_id',
        'parent_id',
        'depth',
        'is_pinned',
        'body',
        'likes_count',
        'replies_count',
        'edited_at',
        'extra_attributes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'depth' => 'integer',
            'is_pinned' => 'boolean',
            'likes_count' => 'integer',
            'replies_count' => 'integer',
            'edited_at' => 'datetime',
            'deleted_at' => 'datetime',
            'extra_attributes' => 'array',
        ];
    }

    /**
     * Owning post.
     *
     * @return BelongsTo<Post, Comment>
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * Author of the comment.
     *
     * @return BelongsTo<User, Comment>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Parent comment for nested replies.
     *
     * @return BelongsTo<Comment, Comment>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * Child comments (replies).
     *
     * @return HasMany<Comment>
     */
    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('created_at');
    }

    public function isHiddenFor(?User $viewer): bool
    {
        if ($viewer === null) {
            return false;
        }

        $author = $this->relationLoaded('author')
            ? $this->getRelation('author')
            : $this->author;

        return $author instanceof User && $viewer->hasBlockRelationshipWith($author);
    }
}

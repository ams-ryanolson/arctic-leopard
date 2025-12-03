<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Repost extends Model
{
    /** @use HasFactory<\Database\Factories\RepostFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'post_id',
        'repost_post_id',
    ];

    /**
     * User who created the amplify.
     *
     * @return BelongsTo<User, Repost>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Original post being amplified.
     *
     * @return BelongsTo<Post, Repost>
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class, 'post_id');
    }

    /**
     * The amplify post created.
     *
     * @return BelongsTo<Post, Repost>
     */
    public function repostPost(): BelongsTo
    {
        return $this->belongsTo(Post::class, 'repost_post_id');
    }
}

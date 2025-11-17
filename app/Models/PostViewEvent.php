<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostViewEvent extends Model
{
    /** @use HasFactory<\Database\Factories\PostViewEventFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'post_id',
        'viewer_id',
        'session_uuid',
        'fingerprint_hash',
        'ip_hash',
        'user_agent_hash',
        'country_code',
        'context',
        'occurred_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'context' => 'array',
            'occurred_at' => 'datetime',
        ];
    }

    /**
     * Retrieve the uppercase ISO country code or null.
     */
    public function getCountryCodeAttribute(?string $value): ?string
    {
        return $value !== null ? strtoupper($value) : null;
    }

    /**
     * Associated post.
     *
     * @return BelongsTo<Post, PostViewEvent>
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * Viewer that triggered the event.
     *
     * @return BelongsTo<User, PostViewEvent>
     */
    public function viewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'viewer_id');
    }
}

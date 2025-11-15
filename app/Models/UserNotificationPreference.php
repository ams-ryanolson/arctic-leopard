<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNotificationPreference extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'follows',
        'follow_requests',
        'follow_approvals',
        'post_likes',
        'post_bookmarks',
        'messages',
        'comments',
        'replies',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'follows' => 'bool',
            'follow_requests' => 'bool',
            'follow_approvals' => 'bool',
            'post_likes' => 'bool',
            'post_bookmarks' => 'bool',
            'messages' => 'bool',
            'comments' => 'bool',
            'replies' => 'bool',
        ];
    }

    /**
     * Get the user that owns the notification preferences.
     *
     * @return BelongsTo<User, UserNotificationPreference>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

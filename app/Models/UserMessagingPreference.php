<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserMessagingPreference extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'message_request_mode',
        'allow_subscriber_messages',
        'filter_low_quality',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'message_request_mode' => 'string',
            'allow_subscriber_messages' => 'bool',
            'filter_low_quality' => 'bool',
        ];
    }

    /**
     * Get the user that owns the messaging preferences.
     *
     * @return BelongsTo<User, UserMessagingPreference>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

<?php

namespace App\Models;

use App\Enums\EventRsvpStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventRsvp extends Model
{
    /** @use HasFactory<\Database\Factories\EventRsvpFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'event_id',
        'user_id',
        'status',
        'guest_count',
        'responded_at',
        'note',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => EventRsvpStatus::class,
            'guest_count' => 'integer',
            'responded_at' => 'datetime',
        ];
    }

    /**
     * Event that this RSVP belongs to.
     *
     * @return BelongsTo<Event, EventRsvp>
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * User who submitted the RSVP.
     *
     * @return BelongsTo<User, EventRsvp>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

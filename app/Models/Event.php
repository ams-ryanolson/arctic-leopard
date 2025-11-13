<?php

namespace App\Models;

use App\Enums\EventModality;
use App\Enums\EventStatus;
use App\Enums\EventType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class Event extends Model
{
    /** @use HasFactory<\Database\Factories\EventFactory> */
    use HasFactory;

    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'series_id',
        'parent_event_id',
        'created_by_id',
        'submitted_by_id',
        'manager_id',
        'approved_by_id',
        'status',
        'modality',
        'type',
        'is_recurring',
        'recurrence_rule',
        'title',
        'slug',
        'subtitle',
        'avatar_path',
        'cover_path',
        'description',
        'starts_at',
        'ends_at',
        'timezone',
        'rsvp_limit',
        'allow_guests',
        'location_name',
        'location_venue',
        'location_address',
        'location_city',
        'location_region',
        'location_postal_code',
        'location_country',
        'location_latitude',
        'location_longitude',
        'virtual_meeting_url',
        'requirements',
        'extra_attributes',
        'submitted_at',
        'approved_at',
        'published_at',
        'cancelled_at',
        'submission_notes',
        'admin_notes',
        'deleted_at',
    ];

    /**
     * Automatically generate a slug if none is provided.
     */
    protected static function booted(): void
    {
        static::creating(function (Event $event): void {
            if (blank($event->slug) && filled($event->title)) {
                $event->slug = static::generateUniqueSlug($event->title);
            }

            if (blank($event->timezone)) {
                $event->timezone = config('app.timezone');
            }

            if ($event->is_recurring && blank($event->series_id)) {
                $event->series_id = Str::uuid()->toString();
            }
        });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => EventStatus::class,
            'modality' => EventModality::class,
            'type' => EventType::class,
            'is_recurring' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
            'published_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'allow_guests' => 'boolean',
            'location_latitude' => 'float',
            'location_longitude' => 'float',
            'requirements' => 'array',
            'extra_attributes' => 'array',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * Parent series event.
     *
     * @return BelongsTo<self, self>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_event_id');
    }

    /**
     * Child events generated from this event.
     *
     * @return HasMany<self>
     */
    public function occurrences(): HasMany
    {
        return $this->hasMany(self::class, 'parent_event_id')
            ->orderBy('starts_at');
    }

    /**
     * User who created the official event.
     *
     * @return BelongsTo<User, self>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    /**
     * User who submitted the event proposal.
     *
     * @return BelongsTo<User, self>
     */
    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by_id');
    }

    /**
     * User delegated to manage the event.
     *
     * @return BelongsTo<User, self>
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    /**
     * Admin who approved the event.
     *
     * @return BelongsTo<User, self>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    /**
     * Tags attached to the event.
     *
     * @return BelongsToMany<EventTag>
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(EventTag::class)
            ->withTimestamps()
            ->withPivot('position')
            ->orderBy('event_event_tag.position');
    }

    /**
     * RSVP records for the event.
     *
     * @return HasMany<EventRsvp>
     */
    public function rsvps(): HasMany
    {
        return $this->hasMany(EventRsvp::class);
    }

    /**
     * Media uploaded for the event.
     *
     * @return HasMany<EventMedia>
     */
    public function media(): HasMany
    {
        return $this->hasMany(EventMedia::class)->orderBy('position');
    }

    /**
     * Scope events that are published and upcoming.
     *
     * @param  Builder<Event>  $query
     * @return Builder<Event>
     */
    public function scopeUpcoming(Builder $query): Builder
    {
        return $query
            ->where('status', EventStatus::Published->value)
            ->where('starts_at', '>=', Carbon::now());
    }

    /**
     * Scope events that are currently published.
     *
     * @param  Builder<Event>  $query
     * @return Builder<Event>
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', EventStatus::Published->value);
    }

    /**
     * Generate a unique slug for the provided title.
     */
    protected static function generateUniqueSlug(string $title): string
    {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $suffix = 1;

        while (static::where('slug', $slug)->withTrashed()->exists()) {
            $slug = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}

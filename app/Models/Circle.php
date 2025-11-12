<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Circle extends Model
{
    /** @use HasFactory<\Database\Factories\CircleFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'interest_id',
        'name',
        'slug',
        'tagline',
        'description',
        'facet_filters',
        'metadata',
        'visibility',
        'is_featured',
        'sort_order',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'facet_filters' => 'array',
        'metadata' => 'array',
        'is_featured' => 'boolean',
    ];

    /**
     * Use the slug for route-model binding.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected static function booted(): void
    {
        static::saving(function (Circle $circle): void {
            if (filled($circle->slug)) {
                return;
            }

            $circle->slug = static::generateUniqueSlug($circle->name, $circle->getKey());
        });
    }

    /**
     * Generate a unique slug for the circle.
     */
    protected static function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);

        if ($base === '') {
            $base = Str::slug(Str::random(16));
        }

        $slug = $base;
        $suffix = 2;

        while (static::where('slug', $slug)
            ->when($ignoreId, static fn ($query) => $query->where('id', '<>', $ignoreId))
            ->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    /**
     * The interest that anchors the circle.
     *
     * @return BelongsTo<Interest, Circle>
     */
    public function interest(): BelongsTo
    {
        return $this->belongsTo(Interest::class);
    }

    /**
     * Facets that further specialize the circle.
     *
     * @return HasMany<CircleFacet>
     */
    public function facets(): HasMany
    {
        return $this->hasMany(CircleFacet::class);
    }

    /**
     * Members that have joined the circle.
     *
     * @return BelongsToMany<User>
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'circle_members')
            ->withPivot([
                'role',
                'preferences',
                'joined_at',
            ])
            ->withTimestamps();
    }

    /**
     * Posts shared within the circle.
     *
     * @return BelongsToMany<Post>
     */
    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'circle_post')
            ->withPivot('is_primary')
            ->withTimestamps();
    }
}

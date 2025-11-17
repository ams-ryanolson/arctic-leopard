<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Interest extends Model
{
    /** @use HasFactory<\Database\Factories\InterestFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
    ];

    /**
     * Ensure the slug remains in sync and unique.
     */
    protected static function booted(): void
    {
        static::saving(function (Interest $interest): void {
            $interest->slug = static::generateUniqueSlug(
                (string) $interest->name,
                $interest->getKey()
            );
        });
    }

    /**
     * Users associated with the interest.
     *
     * @return BelongsToMany<User>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    /**
     * Circles that stem from this interest.
     *
     * @return HasMany<Circle>
     */
    public function circles(): HasMany
    {
        return $this->hasMany(Circle::class);
    }

    /**
     * Generate a unique slug for the interest.
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
}

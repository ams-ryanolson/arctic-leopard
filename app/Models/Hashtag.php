<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;
use Laravel\Scout\Searchable;

class Hashtag extends Model
{
    /** @use HasFactory<\Database\Factories\HashtagFactory> */
    use HasFactory;

    use Searchable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'usage_count',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'usage_count' => 'integer',
        ];
    }

    /**
     * Ensure the slug is unique and tracked automatically.
     */
    protected static function booted(): void
    {
        static::saving(function (Hashtag $hashtag): void {
            $hashtag->slug = static::generateUniqueSlug(
                (string) $hashtag->name,
                $hashtag->getKey()
            );
        });
    }

    /**
     * Users that are associated with the hashtag.
     *
     * @return BelongsToMany<User>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    /**
     * Generate a unique slug for the hashtag.
     */
    protected static function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $normalized = Str::of($name)
            ->replace('#', '')
            ->trim();

        $base = Str::slug((string) $normalized);

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
     * Get the indexable data array for the model.
     *
     * @return array<string, mixed>
     */
    public function toSearchableArray(): array
    {
        return [
            'name' => $this->name,
            'slug' => $this->slug,
        ];
    }

    /**
     * Get the name of the index associated with the model.
     */
    public function searchableAs(): string
    {
        return 'hashtags';
    }
}

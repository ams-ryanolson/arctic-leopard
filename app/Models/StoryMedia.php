<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Throwable;

class StoryMedia extends Model
{
    /** @use HasFactory<\Database\Factories\StoryMediaFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'story_id',
        'disk',
        'path',
        'original_path',
        'optimized_path',
        'blur_path',
        'thumbnail_path',
        'mime_type',
        'width',
        'height',
        'duration',
        'size',
        'meta',
        'processing_meta',
        'processing_status',
        'processing_error',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'url',
        'thumbnail_url',
        'optimized_url',
        'blur_url',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'width' => 'integer',
            'height' => 'integer',
            'duration' => 'integer',
            'size' => 'integer',
            'meta' => 'array',
            'processing_meta' => 'array',
        ];
    }

    protected function url(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value, array $attributes) => $this->resolveMediaUrl($attributes['path'] ?? null, $attributes['disk'] ?? null),
        )->shouldCache();
    }

    protected function thumbnailUrl(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value, array $attributes) => $this->resolveMediaUrl($attributes['thumbnail_path'] ?? null, $attributes['disk'] ?? null),
        )->shouldCache();
    }

    protected function optimizedUrl(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value, array $attributes) => $this->resolveMediaUrl($attributes['optimized_path'] ?? null, $attributes['disk'] ?? null),
        )->shouldCache();
    }

    protected function blurUrl(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value, array $attributes) => $this->resolveMediaUrl($attributes['blur_path'] ?? null, $attributes['disk'] ?? null),
        )->shouldCache();
    }

    /**
     * Parent story.
     *
     * @return BelongsTo<Story, StoryMedia>
     */
    public function story(): BelongsTo
    {
        return $this->belongsTo(Story::class);
    }

    private function resolveMediaUrl(?string $path, ?string $disk = null): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        $storage = Storage::disk($this->mediaDisk($disk));

        $candidates = array_values(array_unique(array_filter([
            $path,
            ltrim($path, '/'),
        ])));

        foreach ($candidates as $candidate) {
            $url = $this->generateUrl($storage, $candidate);

            if ($url !== null) {
                return $url;
            }
        }

        return null;
    }

    private function generateUrl(FilesystemAdapter $storage, string $path): ?string
    {
        try {
            $url = $storage->url($path);
        } catch (Throwable) {
            return null;
        }

        if (! is_string($url) || $url === '') {
            return null;
        }

        return $this->ensureAbsoluteUrl($url);
    }

    private function ensureAbsoluteUrl(string $url): string
    {
        return Str::startsWith($url, ['http://', 'https://'])
            ? $url
            : URL::to($url);
    }

    private function mediaDisk(?string $disk): string
    {
        return $disk ?: $this->disk ?: config('filesystems.default');
    }
}

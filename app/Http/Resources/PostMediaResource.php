<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

/**
 * @mixin \App\Models\PostMedia
 */
class PostMediaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $disk = $this->disk ?: config('filesystems.default');
        $resolveUrl = static function (string $path) use ($disk): string {
            if (Str::startsWith($path, ['http://', 'https://'])) {
                return $path;
            }

            $url = Storage::disk($disk)->url($path);

            // Ensure absolute URL (convert relative URLs to absolute)
            return Str::startsWith($url, ['http://', 'https://'])
                ? $url
                : URL::to($url);
        };

        $absoluteUrl = $resolveUrl($this->path);
        $thumbnailUrl = $this->thumbnail_path
            ? $resolveUrl($this->thumbnail_path)
            : null;
        $optimizedUrl = $this->optimized_path
            ? $resolveUrl($this->optimized_path)
            : null;

        return [
            'id' => $this->id,
            'disk' => $disk,
            'path' => $this->path,
            'url' => $absoluteUrl,
            'thumbnail_path' => $this->thumbnail_path,
            'thumbnail_url' => $thumbnailUrl,
            'optimized_path' => $this->optimized_path,
            'optimized_url' => $optimizedUrl,
            'mime_type' => $this->mime_type,
            'type' => $this->mime_type,
            'position' => $this->position,
            'width' => $this->width,
            'height' => $this->height,
            'duration' => $this->duration,
            'is_primary' => (bool) $this->is_primary,
            'meta' => $this->meta ?? [],
            'alt' => is_array($this->meta) && array_key_exists('alt', $this->meta) ? $this->meta['alt'] : null,
        ];
    }
}

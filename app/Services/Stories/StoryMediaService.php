<?php

namespace App\Services\Stories;

use App\Models\Story;
use App\Models\StoryMedia;
use App\Services\TemporaryUploadService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;
use Throwable;

class StoryMediaService
{
    private const THUMBNAIL_SIZE = 800;

    private const BLUR_SIZE = 20;

    public function __construct(
        private TemporaryUploadService $temporaryUploads,
    ) {}

    private function imageManager(): ImageManager
    {
        return new ImageManager(new Driver);
    }

    /**
     * Attach media from temporary upload to story
     *
     * @param  array<string, mixed>  $mediaAttachment
     */
    public function attachFromTemporary(Story $story, array $mediaAttachment): StoryMedia
    {
        $identifier = $mediaAttachment['identifier'] ?? $mediaAttachment['id'] ?? null;

        if (! is_string($identifier)) {
            throw new \InvalidArgumentException('Media identifier is required.');
        }

        $mimeType = $mediaAttachment['mime_type'] ?? 'application/octet-stream';
        $isImage = Str::startsWith($mimeType, 'image/');
        $isVideo = Str::startsWith($mimeType, 'video/');

        $disk = config('filesystems.default');

        // Promote file from temporary to permanent storage
        $promotedPath = $this->temporaryUploads->promote(
            $identifier,
            sprintf('stories/%d', $story->getKey()),
            $mediaAttachment['filename'] ?? null,
            'public',
        );

        if ($promotedPath === null) {
            throw new \RuntimeException('Failed to promote temporary upload to permanent storage.');
        }

        $originalPath = $promotedPath;
        $optimizedPath = null;
        $thumbnailPath = null;
        $blurredPath = null;
        $width = null;
        $height = null;
        $duration = $mediaAttachment['duration'] ?? null;
        $processingStatus = 'completed';
        $processingMeta = [];

        // Process images synchronously (real-time)
        if ($isImage) {
            try {
                $processed = $this->processImage($disk, $promotedPath, $story->getKey());
                $optimizedPath = $processed['optimized_path'];
                $thumbnailPath = $processed['thumbnail_path'];
                $blurredPath = $processed['blur_path'];
                $width = $processed['width'];
                $height = $processed['height'];

                // Use optimized path as the main path for images
                $promotedPath = $optimizedPath ?? $promotedPath;
            } catch (Throwable $e) {
                $processingStatus = 'failed';
                $processingMeta['error'] = $e->getMessage();
            }
        }

        // For videos, we'll set status to pending and process async later
        if ($isVideo) {
            $processingStatus = 'pending';
            $processingMeta['original_path'] = $originalPath;
            // Video processing will extract dimensions/duration later
        }

        // Extract dimensions for videos if not provided
        if ($isVideo && ($width === null || $height === null)) {
            [$width, $height] = $this->resolveVideoDimensions($disk, $originalPath);
        }

        return StoryMedia::create([
            'story_id' => $story->getKey(),
            'disk' => $disk,
            'path' => $promotedPath,
            'original_path' => $originalPath,
            'optimized_path' => $optimizedPath,
            'thumbnail_path' => $thumbnailPath,
            'blur_path' => $blurredPath,
            'mime_type' => $mimeType,
            'width' => $width ?? $mediaAttachment['width'] ?? null,
            'height' => $height ?? $mediaAttachment['height'] ?? null,
            'duration' => $duration,
            'size' => $mediaAttachment['size'] ?? Storage::disk($disk)->size($originalPath),
            'processing_status' => $processingStatus,
            'processing_meta' => $processingMeta,
            'meta' => array_merge(
                $mediaAttachment['meta'] ?? [],
                [
                    'original_name' => $mediaAttachment['original_name'] ?? null,
                ],
            ),
        ]);
    }

    /**
     * Process an image: optimize, generate thumbnails, and blur placeholder
     *
     * @return array{optimized_path: string|null, thumbnail_path: string|null, blur_path: string|null, width: int|null, height: int|null}
     */
    private function processImage(string $disk, string $path, int $storyId): array
    {
        $storage = Storage::disk($disk);
        $imageContents = $storage->get($path);

        if (! is_string($imageContents)) {
            throw new \RuntimeException('Unable to read image file');
        }

        $imageManager = $this->imageManager();
        $image = $imageManager->read($imageContents);
        $width = $image->width();
        $height = $image->height();

        $baseDir = sprintf('stories/%d', $storyId);
        $baseName = pathinfo($path, PATHINFO_FILENAME);

        // Optimize: Convert to WebP with quality 85
        $optimizedPath = null;
        try {
            $optimized = $image->toWebp(85);
            $optimizedPath = sprintf('%s/%s-optimized.webp', $baseDir, $baseName);
            $storage->put($optimizedPath, $optimized->toString(), ['visibility' => 'public']);
        } catch (Throwable $e) {
            // If WebP conversion fails, keep original
            $optimizedPath = null;
        }

        // Generate thumbnail
        $thumbnailPath = null;
        try {
            $thumbnail = $image->scaleDown(self::THUMBNAIL_SIZE);
            $thumbnailPath = sprintf('%s/%s-thumb-%d.webp', $baseDir, $baseName, self::THUMBNAIL_SIZE);
            $storage->put($thumbnailPath, $thumbnail->toWebp(80)->toString(), ['visibility' => 'public']);
        } catch (Throwable $e) {
            // Thumbnail generation is optional
        }

        // Generate blurred placeholder
        $blurPath = null;
        try {
            $blurred = $image
                ->scaleDown(self::BLUR_SIZE)
                ->blur(self::BLUR_SIZE);
            $blurPath = sprintf('%s/%s-blur.webp', $baseDir, $baseName);
            $storage->put($blurPath, $blurred->toWebp(60)->toString(), ['visibility' => 'public']);
        } catch (Throwable $e) {
            // Blur generation is optional
        }

        return [
            'optimized_path' => $optimizedPath,
            'thumbnail_path' => $thumbnailPath,
            'blur_path' => $blurPath,
            'width' => $width,
            'height' => $height,
        ];
    }

    /**
     * @return array{0:?int,1:?int}
     */
    private function resolveVideoDimensions(string $disk, string $path): array
    {
        // Video dimension extraction will be handled by video processing service
        // For now, return null - will be populated when video processing is implemented
        return [null, null];
    }
}

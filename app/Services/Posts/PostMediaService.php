<?php

namespace App\Services\Posts;

use App\Models\Post;
use App\Models\PostMedia;
use App\Services\TemporaryUploadService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;
use Throwable;

class PostMediaService
{
    private const THUMBNAIL_SIZES = [
        'small' => 400,
        'medium' => 800,
        'large' => 1200,
    ];

    private const BLUR_SIZE = 20;

    public function __construct(
        private TemporaryUploadService $temporaryUploads,
    ) {}

    private function imageManager(): ImageManager
    {
        return new ImageManager(new Driver);
    }

    /**
     * @param  array<int, array<string, mixed>>  $mediaAttachments
     * @return array<int, PostMedia>
     */
    public function attachFromTemporary(Post $post, array $mediaAttachments): array
    {
        if ($mediaAttachments === []) {
            return [];
        }

        $disk = config('filesystems.default');
        $stored = [];

        foreach (array_values($mediaAttachments) as $index => $attachment) {
            $identifier = $attachment['identifier'] ?? $attachment['id'] ?? null;

            if (! is_string($identifier)) {
                continue;
            }

            $mimeType = $attachment['mime_type'] ?? 'application/octet-stream';
            $isImage = Str::startsWith($mimeType, 'image/');
            $isVideo = Str::startsWith($mimeType, 'video/');

            // Promote file from temporary to permanent storage
            $promotedPath = $this->temporaryUploads->promote(
                $identifier,
                sprintf('posts/%d', $post->getKey()),
                $attachment['filename'] ?? null,
                'public',
            );

            if ($promotedPath === null) {
                continue;
            }

            $originalPath = $promotedPath;
            $optimizedPath = null;
            $thumbnailPath = null;
            $blurPath = null;
            $width = null;
            $height = null;
            $duration = $attachment['duration'] ?? null;
            $processingStatus = 'completed';
            $processingMeta = [];

            // Process images synchronously (real-time)
            if ($isImage) {
                try {
                    $processed = $this->processImage($disk, $promotedPath, $post->getKey());
                    $optimizedPath = $processed['optimized_path'];
                    $thumbnailPath = $processed['thumbnail_path'];
                    $blurPath = $processed['blur_path'];
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

            $stored[] = PostMedia::create([
                'post_id' => $post->getKey(),
                'disk' => $disk,
                'path' => $promotedPath,
                'original_path' => $originalPath,
                'optimized_path' => $optimizedPath,
                'thumbnail_path' => $thumbnailPath,
                'blur_path' => $blurPath,
                'mime_type' => $mimeType,
                'position' => $attachment['position'] ?? $index,
                'width' => $width ?? $attachment['width'] ?? null,
                'height' => $height ?? $attachment['height'] ?? null,
                'duration' => $duration,
                'is_primary' => $attachment['is_primary'] ?? $index === 0,
                'processing_status' => $processingStatus,
                'processing_meta' => $processingMeta,
                'meta' => array_merge(
                    $attachment['meta'] ?? [],
                    [
                        'original_name' => $attachment['original_name'] ?? null,
                        'size' => $attachment['size'] ?? Storage::disk($disk)->size($originalPath),
                    ],
                ),
            ]);
        }

        return $stored;
    }

    /**
     * Process an image: optimize, generate thumbnails, and blur placeholder
     *
     * @return array{optimized_path: string|null, thumbnail_path: string|null, blur_path: string|null, width: int|null, height: int|null}
     */
    private function processImage(string $disk, string $path, int $postId): array
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

        $baseDir = sprintf('posts/%d', $postId);
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

        // Generate thumbnail (medium size for now)
        $thumbnailPath = null;
        try {
            $thumbnail = $image->scaleDown(self::THUMBNAIL_SIZES['medium']);
            $thumbnailPath = sprintf('%s/%s-thumb-%d.webp', $baseDir, $baseName, self::THUMBNAIL_SIZES['medium']);
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

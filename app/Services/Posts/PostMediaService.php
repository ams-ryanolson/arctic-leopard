<?php

namespace App\Services\Posts;

use App\Models\Post;
use App\Models\PostMedia;
use App\Services\Media\MediaProcessingService;
use App\Services\Media\Processors\PostImageProcessor;
use App\Services\TemporaryUploadService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class PostMediaService
{
    public function __construct(
        private TemporaryUploadService $temporaryUploads,
        private MediaProcessingService $mediaProcessing,
    ) {}

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
                    $baseDir = sprintf('posts/%d', $post->getKey());
                    $baseFilename = pathinfo($promotedPath, PATHINFO_FILENAME);
                    $processor = new PostImageProcessor($baseDir, $baseFilename);
                    $processed = $this->mediaProcessing->processImage($disk, $promotedPath, $processor);

                    $optimizedPath = $processed['optimized_path'];
                    $thumbnailPath = $processed['thumbnail_path'];
                    $blurPath = $processed['blur_path'];
                    $width = $processed['width'];
                    $height = $processed['height'];

                    // Use optimized path as the main path for images
                    $promotedPath = $optimizedPath ?? $promotedPath;
                } catch (Throwable $e) {
                    \Log::warning('PostMediaService: Image processing failed', [
                        'post_id' => $post->getKey(),
                        'path' => $promotedPath,
                        'error' => $e->getMessage(),
                    ]);
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
     * @return array{0:?int,1:?int}
     */
    private function resolveVideoDimensions(string $disk, string $path): array
    {
        // Video dimension extraction will be handled by video processing service
        // For now, return null - will be populated when video processing is implemented
        return [null, null];
    }
}

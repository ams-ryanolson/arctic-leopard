<?php

namespace App\Services\Stories;

use App\Models\Story;
use App\Models\StoryMedia;
use App\Services\Media\MediaProcessingService;
use App\Services\Media\Processors\StoryImageProcessor;
use App\Services\TemporaryUploadService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class StoryMediaService
{
    public function __construct(
        private TemporaryUploadService $temporaryUploads,
        private MediaProcessingService $mediaProcessing,
    ) {}

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
                $baseDir = sprintf('stories/%d', $story->getKey());
                $baseFilename = pathinfo($promotedPath, PATHINFO_FILENAME);
                $processor = new StoryImageProcessor($baseDir, $baseFilename);
                $processed = $this->mediaProcessing->processImage($disk, $promotedPath, $processor);

                $optimizedPath = $processed['optimized_path'];
                $thumbnailPath = $processed['thumbnail_path'];
                $blurredPath = $processed['blur_path'];
                $width = $processed['width'];
                $height = $processed['height'];

                // Use optimized path as the main path for images
                $promotedPath = $optimizedPath ?? $promotedPath;
            } catch (Throwable $e) {
                \Log::warning('StoryMediaService: Image processing failed', [
                    'story_id' => $story->getKey(),
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
     * @return array{0:?int,1:?int}
     */
    private function resolveVideoDimensions(string $disk, string $path): array
    {
        // Video dimension extraction will be handled by video processing service
        // For now, return null - will be populated when video processing is implemented
        return [null, null];
    }
}

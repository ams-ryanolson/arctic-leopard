<?php

namespace App\Services\Messaging;

use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use App\Services\Media\MediaProcessingService;
use App\Services\Media\Processors\MessageImageProcessor;
use App\Services\TemporaryUploadService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class MessageAttachmentService
{
    public function __construct(
        private TemporaryUploadService $temporaryUploads,
        private MediaProcessingService $mediaProcessing,
    ) {}

    /**
     * @param  array<int, array<string, mixed>>  $attachments
     * @return array<int, MessageAttachment>
     */
    public function attachFromTemporary(Message $message, User $uploadedBy, array $attachments): array
    {
        if ($attachments === []) {
            return [];
        }

        $disk = config('filesystems.default');
        $stored = [];

        foreach (array_values($attachments) as $index => $attachment) {
            $identifier = $attachment['id'] ?? $attachment['identifier'] ?? null;

            if (! is_string($identifier)) {
                continue;
            }

            $promotedPath = $this->temporaryUploads->promote(
                $identifier,
                sprintf('messages/%d', $message->conversation_id),
                $attachment['filename'] ?? null,
                'public',
            );

            if ($promotedPath === null) {
                continue;
            }

            $mimeType = $attachment['mime_type'] ?? Storage::disk($disk)->mimeType($promotedPath) ?? 'application/octet-stream';
            $isImage = Str::startsWith($mimeType, 'image/');
            $isVideo = Str::startsWith($mimeType, 'video/');

            $originalPath = $promotedPath;
            $optimizedPath = null;
            $width = null;
            $height = null;
            $processingStatus = 'completed';
            $processingMeta = [];

            // Process images synchronously
            if ($isImage) {
                try {
                    $baseDir = sprintf('messages/%d', $message->conversation_id);
                    $baseFilename = pathinfo($promotedPath, PATHINFO_FILENAME);
                    $processor = new MessageImageProcessor($baseDir, $baseFilename);
                    $processed = $this->mediaProcessing->processImage($disk, $promotedPath, $processor);

                    $optimizedPath = $processed['optimized_path'];
                    $width = $processed['width'];
                    $height = $processed['height'];

                    // Use optimized path as the main path for images
                    $promotedPath = $optimizedPath ?? $promotedPath;
                } catch (Throwable $e) {
                    \Log::warning('MessageAttachmentService: Image processing failed', [
                        'message_id' => $message->getKey(),
                        'path' => $promotedPath,
                        'error' => $e->getMessage(),
                    ]);
                    $processingStatus = 'failed';
                    $processingMeta['error'] = $e->getMessage();
                    // Fall back to original dimensions
                    [$width, $height] = $this->resolveImageDimensions($disk, $promotedPath, $mimeType);
                }
            } else {
                // For non-images, just get dimensions
                [$width, $height] = $this->resolveImageDimensions($disk, $promotedPath, $mimeType);
            }

            // For videos, set status to pending
            if ($isVideo) {
                $processingStatus = 'pending';
                $processingMeta['original_path'] = $originalPath;
            }

            $stored[] = $message->attachments()->create([
                'uploaded_by_id' => $uploadedBy->getKey(),
                'type' => $this->resolveType($mimeType),
                'disk' => $disk,
                'path' => $promotedPath,
                'filename' => basename($promotedPath),
                'mime_type' => $mimeType,
                'size' => $attachment['size'] ?? Storage::disk($disk)->size($originalPath),
                'width' => $width,
                'height' => $height,
                'duration' => $attachment['duration'] ?? null,
                'ordering' => $index,
                'is_inline' => false,
                'is_primary' => $index === 0,
                'processing_status' => $processingStatus,
                'processing_meta' => $processingMeta,
                'meta' => [
                    'original_name' => $attachment['original_name'] ?? null,
                ],
            ]);
        }

        return $stored;
    }

    protected function resolveType(string $mime): string
    {
        if (Str::startsWith($mime, 'image/')) {
            return 'image';
        }

        if (Str::startsWith($mime, 'video/')) {
            return 'video';
        }

        if (Str::startsWith($mime, 'audio/')) {
            return 'audio';
        }

        return 'file';
    }

    /**
     * @return array{0:?int,1:?int}
     */
    protected function resolveImageDimensions(string $disk, string $path, string $mime): array
    {
        if (! Str::startsWith($mime, 'image/')) {
            return [null, null];
        }

        try {
            $contents = Storage::disk($disk)->get($path);

            if (! is_string($contents)) {
                return [null, null];
            }

            $size = getimagesizefromstring($contents);

            if (! is_array($size)) {
                return [null, null];
            }

            return [
                isset($size[0]) ? (int) $size[0] : null,
                isset($size[1]) ? (int) $size[1] : null,
            ];
        } catch (\Throwable) {
            return [null, null];
        }
    }
}

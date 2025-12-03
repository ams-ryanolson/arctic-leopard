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
            $isAudio = Str::startsWith($mimeType, 'audio/');

            $originalPath = $promotedPath;
            $optimizedPath = null;
            $width = null;
            $height = null;
            $duration = $attachment['duration'] ?? null;
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

            // Calculate duration for audio/video files if not provided
            if ($duration === null && ($isAudio || $isVideo)) {
                $duration = $this->resolveMediaDuration($disk, $promotedPath, $mimeType);
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
                'duration' => $duration,
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

    /**
     * Resolve media duration for audio/video files using FFmpeg
     *
     * @return int|null Duration in seconds, or null if unable to determine
     */
    protected function resolveMediaDuration(string $disk, string $path, string $mime): ?int
    {
        if (! Str::startsWith($mime, ['audio/', 'video/'])) {
            return null;
        }

        try {
            // Check if FFmpeg is available
            $ffmpegPath = config('media.ffmpeg_path', 'ffmpeg');
            $ffprobePath = config('media.ffprobe_path', 'ffprobe');

            if (! $this->commandExists($ffprobePath) && ! $this->commandExists($ffmpegPath)) {
                \Log::warning('MessageAttachmentService: FFmpeg/ffprobe not available for duration calculation', [
                    'path' => $path,
                    'mime' => $mime,
                ]);

                return null;
            }

            // Handle remote storage (S3, etc.) by downloading temporarily
            $storage = Storage::disk($disk);
            $tempFile = null;
            $filePath = null;

            try {
                // Try to get local path, if that fails, download to temp file
                try {
                    $filePath = $storage->path($path);
                    // Verify the file actually exists locally
                    if (! file_exists($filePath)) {
                        throw new \RuntimeException('File does not exist locally');
                    }
                } catch (Throwable) {
                    // Remote storage - download to temporary file
                    $tempFile = tempnam(sys_get_temp_dir(), 'media_duration_');
                    if ($tempFile === false) {
                        throw new \RuntimeException('Could not create temporary file');
                    }
                    $contents = $storage->get($path);
                    if ($contents === null) {
                        throw new \RuntimeException('Could not read file from storage');
                    }
                    file_put_contents($tempFile, $contents);
                    $filePath = $tempFile;
                }

                // Try ffprobe first (more reliable for duration)
                if ($this->commandExists($ffprobePath)) {
                    $command = sprintf(
                        '%s -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "%s" 2>&1',
                        escapeshellarg($ffprobePath),
                        escapeshellarg($filePath)
                    );

                    $output = shell_exec($command);

                    if ($output !== null && $output !== '') {
                        $duration = (float) trim($output);
                        if ($duration > 0 && is_finite($duration)) {
                            return (int) round($duration);
                        }
                    }
                }

                // Fallback to ffmpeg if ffprobe not available
                if ($this->commandExists($ffmpegPath)) {
                    $command = sprintf(
                        '%s -i "%s" 2>&1 | grep -i duration | head -1',
                        escapeshellarg($ffmpegPath),
                        escapeshellarg($filePath)
                    );

                    $output = shell_exec($command);

                    if ($output !== null && preg_match('/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})/', $output, $matches)) {
                        $hours = (int) $matches[1];
                        $minutes = (int) $matches[2];
                        $seconds = (int) $matches[3];
                        $duration = ($hours * 3600) + ($minutes * 60) + $seconds;

                        return $duration > 0 ? $duration : null;
                    }
                }

                \Log::warning('MessageAttachmentService: Could not determine duration', [
                    'path' => $path,
                    'mime' => $mime,
                    'ffmpeg_available' => $this->commandExists($ffmpegPath),
                    'ffprobe_available' => $this->commandExists($ffprobePath),
                ]);

                return null;
            } finally {
                // Clean up temporary file
                if ($tempFile !== null && file_exists($tempFile)) {
                    @unlink($tempFile);
                }
            }
        } catch (Throwable $e) {
            \Log::warning('MessageAttachmentService: Error determining duration', [
                'path' => $path,
                'mime' => $mime,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Check if a command exists and is executable
     */
    protected function commandExists(string $command): bool
    {
        $whereIsCommand = PHP_OS === 'WINNT' ? 'where' : 'which';

        $process = proc_open(
            "$whereIsCommand $command",
            [
                0 => ['pipe', 'r'],
                1 => ['pipe', 'w'],
                2 => ['pipe', 'w'],
            ],
            $pipes
        );

        if ($process !== false) {
            $stdout = stream_get_contents($pipes[1]);
            proc_close($process);

            return $stdout !== '';
        }

        return false;
    }
}

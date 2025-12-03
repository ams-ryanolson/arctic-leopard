<?php

namespace App\Services\Media\Processors;

use App\Services\Media\VideoProcessorInterface;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;

class FFmpegVideoProcessor implements VideoProcessorInterface
{
    private string $ffmpegPath;

    private string $ffprobePath;

    private string $tempDir;

    public function __construct()
    {
        $this->ffmpegPath = config('media.ffmpeg_path', 'ffmpeg');
        $this->ffprobePath = config('media.ffprobe_path', 'ffprobe');
        $this->tempDir = config('media.video.temp_dir', storage_path('app/temp/videos'));

        // Ensure temp directory exists
        if (! is_dir($this->tempDir)) {
            mkdir($this->tempDir, 0755, true);
        }
    }

    /**
     * Process a video file: convert to MP4, generate thumbnail, extract metadata
     *
     * @param  string  $disk  Storage disk name
     * @param  string  $path  Path to the video file (can be URL for CDN)
     * @param  array<string, mixed>  $config  Processing configuration
     * @return array<string, mixed>
     */
    public function process(string $disk, string $path, array $config): array
    {
        $baseDir = $config['base_directory'] ?? 'videos';
        $baseFilename = $config['base_filename'] ?? Str::random(16);

        // Check if path is a URL (CDN) - this is the case for migration
        $isUrl = filter_var($path, FILTER_VALIDATE_URL);
        $tempInputFile = null;
        $inputPath = $path;

        if ($isUrl) {
            \Log::info('FFmpegVideoProcessor: Downloading video from CDN', ['url' => $path]);
            $tempInputFile = $this->tempDir.'/'.Str::random(16).'.flv';

            // Download with timeout and error handling
            $context = stream_context_create([
                'http' => [
                    'timeout' => 300, // 5 minutes
                    'follow_location' => true,
                ],
            ]);

            $videoContents = @file_get_contents($path, false, $context);

            if ($videoContents === false) {
                $error = error_get_last();
                throw new \RuntimeException("Failed to download video from: {$path}. Error: ".($error['message'] ?? 'Unknown error'));
            }

            file_put_contents($tempInputFile, $videoContents);
            $inputPath = $tempInputFile;
        } else {
            // For local files, download to temp if on remote storage
            $storage = Storage::disk($disk);

            if (! $storage->exists($path)) {
                throw new \RuntimeException("Video file not found: {$path}");
            }

            $tempInputFile = $this->tempDir.'/'.Str::random(16).'.'.pathinfo($path, PATHINFO_EXTENSION);
            $videoContents = $storage->get($path);

            if ($videoContents === false) {
                throw new \RuntimeException("Failed to read video file: {$path}");
            }

            file_put_contents($tempInputFile, $videoContents);
            $inputPath = $tempInputFile;
        }

        try {
            // Extract metadata first
            $metadata = $this->extractMetadata('local', $inputPath);
            $duration = $metadata['duration'] ?? null;

            // Convert to MP4
            $tempOutputFile = $this->tempDir.'/'.Str::random(16).'.mp4';
            $this->convertToMp4($inputPath, $tempOutputFile);

            // Upload MP4 to S3
            $mp4Path = sprintf('%s/%s.mp4', $baseDir, $baseFilename);
            $s3Storage = Storage::disk('s3');
            $mp4Contents = file_get_contents($tempOutputFile);
            $s3Storage->put($mp4Path, $mp4Contents, [
                'visibility' => 'public',
                'ACL' => 'public-read',
            ]);

            // Generate thumbnail
            $thumbnailPath = $this->generateThumbnail('local', $inputPath);
            $thumbnailS3Path = null;

            if ($thumbnailPath) {
                $thumbnailS3Path = sprintf('%s/%s-thumb.jpg', $baseDir, $baseFilename);
                $thumbnailContents = file_get_contents($thumbnailPath);
                $s3Storage->put($thumbnailS3Path, $thumbnailContents, [
                    'visibility' => 'public',
                    'ACL' => 'public-read',
                ]);
                unlink($thumbnailPath);
            }

            // Clean up temp files
            if ($tempInputFile && file_exists($tempInputFile)) {
                unlink($tempInputFile);
            }
            if (file_exists($tempOutputFile)) {
                unlink($tempOutputFile);
            }

            return [
                'original_path' => $path,
                'optimized_path' => $mp4Path,
                'thumbnail_path' => $thumbnailS3Path,
                'blur_path' => null,
                'width' => $metadata['width'] ?? null,
                'height' => $metadata['height'] ?? null,
                'duration' => $duration,
                'mime_type' => 'video/mp4',
                'processing_status' => 'completed',
                'processing_meta' => [
                    'original_path' => $path,
                    'converted_from' => pathinfo($inputPath, PATHINFO_EXTENSION),
                ],
            ];
        } catch (\Exception $e) {
            // Clean up temp files on error
            if ($tempInputFile && file_exists($tempInputFile)) {
                @unlink($tempInputFile);
            }

            throw $e;
        }
    }

    /**
     * Generate a thumbnail from a video at 10% of duration
     *
     * @param  string  $disk  Storage disk name
     * @param  string  $path  Path to the video file
     * @return string|null Path to the generated thumbnail, or null if generation failed
     */
    public function generateThumbnail(string $disk, string $path): ?string
    {
        try {
            // Get video duration
            $metadata = $this->extractMetadata($disk, $path);
            $duration = $metadata['duration'] ?? null;

            if (! $duration) {
                \Log::warning('FFmpegVideoProcessor: Cannot generate thumbnail - no duration available', [
                    'path' => $path,
                ]);

                return null;
            }

            // Calculate thumbnail time (10% of duration)
            $thumbnailTime = $duration * config('media.video.thumbnail_time', 0.1);
            $thumbnailTime = max(1, $thumbnailTime); // At least 1 second

            $outputPath = $this->tempDir.'/'.Str::random(16).'.jpg';

            $command = [
                $this->ffmpegPath,
                '-i', $path,
                '-ss', (string) $thumbnailTime,
                '-vframes', '1',
                '-q:v', (string) config('media.video.thumbnail_quality', 85),
                '-y', // Overwrite output file
                $outputPath,
            ];

            $process = new Process($command);
            $process->setTimeout(300); // 5 minutes timeout
            $process->run();

            if (! $process->isSuccessful()) {
                \Log::error('FFmpegVideoProcessor: Thumbnail generation failed', [
                    'path' => $path,
                    'error' => $process->getErrorOutput(),
                ]);

                return null;
            }

            if (! file_exists($outputPath)) {
                \Log::error('FFmpegVideoProcessor: Thumbnail file not created', [
                    'path' => $path,
                    'output_path' => $outputPath,
                ]);

                return null;
            }

            return $outputPath;
        } catch (\Exception $e) {
            \Log::error('FFmpegVideoProcessor: Exception during thumbnail generation', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Extract metadata from a video file
     *
     * @param  string  $disk  Storage disk name
     * @param  string  $path  Path to the video file
     * @return array<string, mixed> Metadata including width, height, duration, etc.
     */
    public function extractMetadata(string $disk, string $path): array
    {
        try {
            $command = [
                $this->ffprobePath,
                '-v', 'error',
                '-show_entries', 'stream=width,height,duration',
                '-show_entries', 'format=duration,size',
                '-of', 'json',
                $path,
            ];

            $process = new Process($command);
            $process->setTimeout(60);
            $process->run();

            if (! $process->isSuccessful()) {
                \Log::warning('FFmpegVideoProcessor: Metadata extraction failed', [
                    'path' => $path,
                    'error' => $process->getErrorOutput(),
                ]);

                return [
                    'width' => null,
                    'height' => null,
                    'duration' => null,
                    'size' => null,
                ];
            }

            $output = json_decode($process->getOutput(), true);

            if (! $output) {
                return [
                    'width' => null,
                    'height' => null,
                    'duration' => null,
                    'size' => null,
                ];
            }

            // Extract video stream dimensions
            $width = null;
            $height = null;
            $duration = null;
            $size = null;

            if (isset($output['streams'])) {
                foreach ($output['streams'] as $stream) {
                    if (isset($stream['width']) && isset($stream['height'])) {
                        $width = (int) $stream['width'];
                        $height = (int) $stream['height'];
                    }
                    if (isset($stream['duration']) && $duration === null) {
                        $duration = (float) $stream['duration'];
                    }
                }
            }

            // Get duration from format if not in stream
            if ($duration === null && isset($output['format']['duration'])) {
                $duration = (float) $output['format']['duration'];
            }

            // Get file size
            if (isset($output['format']['size'])) {
                $size = (int) $output['format']['size'];
            } else {
                $size = file_exists($path) ? filesize($path) : null;
            }

            return [
                'width' => $width,
                'height' => $height,
                'duration' => $duration ? (int) round($duration) : null,
                'size' => $size,
            ];
        } catch (\Exception $e) {
            \Log::error('FFmpegVideoProcessor: Exception during metadata extraction', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            return [
                'width' => null,
                'height' => null,
                'duration' => null,
                'size' => null,
            ];
        }
    }

    /**
     * Convert video to MP4 format using FFmpeg
     *
     * @param  string  $inputPath  Path to input video file
     * @param  string  $outputPath  Path to output MP4 file
     */
    private function convertToMp4(string $inputPath, string $outputPath): void
    {
        $config = config('media.video');

        $command = [
            $this->ffmpegPath,
            '-i', $inputPath,
            '-c:v', $config['video_codec'],
            '-c:a', $config['audio_codec'],
            '-crf', (string) $config['crf'],
            '-preset', $config['preset'],
            '-b:a', $config['audio_bitrate'],
            '-ar', (string) $config['audio_sample_rate'],
            '-movflags', '+faststart', // Optimize for web streaming
            '-y', // Overwrite output file
            $outputPath,
        ];

        $process = new Process($command);
        $process->setTimeout(3600); // 1 hour timeout for large videos
        $process->run();

        if (! $process->isSuccessful()) {
            throw new \RuntimeException(
                "FFmpeg conversion failed: {$process->getErrorOutput()}"
            );
        }

        if (! file_exists($outputPath)) {
            throw new \RuntimeException("Converted video file not created: {$outputPath}");
        }
    }
}

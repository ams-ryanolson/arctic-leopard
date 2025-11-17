<?php

namespace App\Services\Media;

use App\Services\Media\Processors\ImageProcessorInterface;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Intervention\Image\Drivers\Imagick\Driver as ImagickDriver;
use Intervention\Image\ImageManager;
use Throwable;

class MediaProcessingService
{
    private function imageManager(): ImageManager
    {
        // Prefer Imagick for better performance and large image handling
        if (extension_loaded('imagick')) {
            return new ImageManager(new ImagickDriver);
        }

        // Fall back to GD if Imagick is not available
        return new ImageManager(new GdDriver);
    }

    /**
     * Process an image using the provided processor configuration
     *
     * @param  string  $disk  Storage disk name
     * @param  string  $path  Path to the image file
     * @param  ImageProcessorInterface  $processor  Processor instance with configuration
     * @return array{original_path: string, optimized_path: string|null, thumbnail_path: string|null, blur_path: string|null, width: int|null, height: int|null, size: int, mime_type: string}
     */
    public function processImage(
        string $disk,
        string $path,
        ImageProcessorInterface $processor
    ): array {
        \Log::info('MediaProcessingService: processImage started', [
            'disk' => $disk,
            'path' => $path,
        ]);

        $storage = Storage::disk($disk);
        \Log::info('MediaProcessingService: reading image file', ['path' => $path]);
        $imageContents = $storage->get($path);

        if (! is_string($imageContents)) {
            \Log::error('MediaProcessingService: Unable to read image file', ['path' => $path]);
            throw new \RuntimeException('Unable to read image file');
        }

        $contentSize = strlen($imageContents);
        \Log::info('MediaProcessingService: image file read successfully', [
            'path' => $path,
            'size' => $contentSize,
            'memory_usage_before' => memory_get_usage(true),
            'memory_limit' => ini_get('memory_limit'),
        ]);

        $imageManager = $this->imageManager();
        \Log::info('MediaProcessingService: reading image with Intervention', [
            'path' => $path,
            'content_size' => $contentSize,
        ]);

        try {
            // Set a higher memory limit temporarily for large image processing
            $originalMemoryLimit = ini_get('memory_limit');
            if ($contentSize > 5 * 1024 * 1024) { // If image is > 5MB
                ini_set('memory_limit', '512M');
                \Log::info('MediaProcessingService: Increased memory limit for large image', [
                    'original_limit' => $originalMemoryLimit,
                    'new_limit' => '512M',
                ]);
            }

            $image = $imageManager->read($imageContents);

            // Free memory by unsetting the image contents after reading
            unset($imageContents);

            \Log::info('MediaProcessingService: Intervention read successful', [
                'path' => $path,
                'memory_usage_after_read' => memory_get_usage(true),
            ]);
        } catch (\Throwable $e) {
            // Free memory on error
            unset($imageContents);

            \Log::error('MediaProcessingService: Failed to read image with Intervention', [
                'path' => $path,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'memory_usage' => memory_get_usage(true),
                'memory_limit' => ini_get('memory_limit'),
            ]);
            throw new \RuntimeException('Failed to process image: '.$e->getMessage(), 0, $e);
        }

        try {
            $originalWidth = $image->width();
            $originalHeight = $image->height();
            $originalSize = $storage->size($path);
            $mimeType = $storage->mimeType($path) ?? 'image/jpeg';

            \Log::info('MediaProcessingService: image loaded', [
                'path' => $path,
                'width' => $originalWidth,
                'height' => $originalHeight,
                'size' => $originalSize,
                'mime_type' => $mimeType,
                'memory_usage' => memory_get_usage(true),
            ]);
        } catch (\Throwable $e) {
            \Log::error('MediaProcessingService: Failed to get image dimensions', [
                'path' => $path,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw new \RuntimeException('Failed to get image dimensions: '.$e->getMessage(), 0, $e);
        }

        $config = $processor->getConfig();
        $baseDir = $config['base_directory'];
        $baseFilename = $config['base_filename'] ?? pathinfo($path, PATHINFO_FILENAME);

        \Log::info('MediaProcessingService: processing image with processor', [
            'base_dir' => $baseDir,
            'base_filename' => $baseFilename,
        ]);

        // Process the image according to processor configuration
        $processedImage = $processor->process($image);

        \Log::info('MediaProcessingService: image processed successfully', [
            'base_dir' => $baseDir,
            'base_filename' => $baseFilename,
        ]);

        $optimizedPath = null;
        $thumbnailPath = null;
        $blurPath = null;

        // Helper to get storage options with proper ACL for S3/MinIO
        $getStorageOptions = function (string $visibility = 'public') use ($storage): array {
            $options = ['visibility' => $visibility];

            // Check if using S3/MinIO adapter (both use AwsS3V3Adapter)
            $adapter = $storage->getAdapter();
            if ($adapter instanceof \League\Flysystem\AwsS3V3\AwsS3V3Adapter) {
                $options['ACL'] = $visibility === 'public' ? 'public-read' : 'private';
            }

            return $options;
        };

        // Generate optimized version
        if ($config['generate_optimized'] ?? true) {
            try {
                $optimized = $processedImage->toWebp($config['quality'] ?? 85);
                $optimizedPath = sprintf('%s/%s-optimized.webp', $baseDir, $baseFilename);
                $storage->put($optimizedPath, $optimized->toString(), $getStorageOptions('public'));
                // Explicitly set visibility to ensure it's applied (important for S3/MinIO)
                $storage->setVisibility($optimizedPath, 'public');
            } catch (Throwable $e) {
                \Log::warning('MediaProcessingService: Failed to generate optimized image', [
                    'path' => $path,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Generate thumbnail if configured
        if (($config['generate_thumbnail'] ?? false) && isset($config['thumbnail_size'])) {
            try {
                $thumbnail = $image->scaleDown($config['thumbnail_size']);
                $thumbnailPath = sprintf('%s/%s-thumb-%d.webp', $baseDir, $baseFilename, $config['thumbnail_size']);
                $storage->put($thumbnailPath, $thumbnail->toWebp($config['thumbnail_quality'] ?? 80)->toString(), $getStorageOptions('public'));
                // Explicitly set visibility to ensure it's applied (important for S3/MinIO)
                $storage->setVisibility($thumbnailPath, 'public');
            } catch (Throwable $e) {
                \Log::warning('MediaProcessingService: Failed to generate thumbnail', [
                    'path' => $path,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Generate blur placeholder if configured
        if ($config['generate_blur'] ?? false) {
            try {
                $blurSize = $config['blur_size'] ?? 20;
                $blurred = $image
                    ->scaleDown($blurSize)
                    ->blur($blurSize);
                $blurPath = sprintf('%s/%s-blur.webp', $baseDir, $baseFilename);
                $storage->put($blurPath, $blurred->toWebp($config['blur_quality'] ?? 60)->toString(), $getStorageOptions('public'));
                // Explicitly set visibility to ensure it's applied (important for S3/MinIO)
                $storage->setVisibility($blurPath, 'public');
            } catch (Throwable $e) {
                \Log::warning('MediaProcessingService: Failed to generate blur placeholder', [
                    'path' => $path,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return [
            'original_path' => $path,
            'optimized_path' => $optimizedPath,
            'thumbnail_path' => $thumbnailPath,
            'blur_path' => $blurPath,
            'width' => $originalWidth,
            'height' => $originalHeight,
            'size' => $originalSize,
            'mime_type' => $mimeType,
        ];
    }

    /**
     * Process a video (placeholder for future implementation)
     *
     * @param  string  $disk  Storage disk name
     * @param  string  $path  Path to the video file
     * @param  array<string, mixed>  $config  Processing configuration
     * @return array<string, mixed>|null
     */
    public function processVideo(string $disk, string $path, array $config): ?array
    {
        // Placeholder - video processing will be implemented later
        // For now, return null to indicate video processing is not yet available
        return null;
    }
}

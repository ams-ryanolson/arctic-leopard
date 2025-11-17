<?php

namespace App\Services\Media\Processors;

use App\Services\Media\VideoProcessorInterface;

/**
 * Null video processor - placeholder for future video processing implementation
 * Returns placeholder data and sets processing status to 'pending'
 */
class NullVideoProcessor implements VideoProcessorInterface
{
    public function process(string $disk, string $path, array $config): array
    {
        // Placeholder - video processing not yet implemented
        // Returns minimal data structure indicating video needs processing
        return [
            'original_path' => $path,
            'optimized_path' => null,
            'thumbnail_path' => null,
            'blur_path' => null,
            'width' => null,
            'height' => null,
            'duration' => null,
            'size' => null,
            'mime_type' => 'video/mp4',
            'processing_status' => 'pending',
            'processing_meta' => [
                'original_path' => $path,
                'message' => 'Video processing not yet implemented',
            ],
        ];
    }

    public function generateThumbnail(string $disk, string $path): ?string
    {
        // Placeholder - thumbnail generation not yet implemented
        return null;
    }

    public function extractMetadata(string $disk, string $path): array
    {
        // Placeholder - metadata extraction not yet implemented
        return [
            'width' => null,
            'height' => null,
            'duration' => null,
            'size' => null,
        ];
    }
}

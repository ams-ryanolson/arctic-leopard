<?php

namespace App\Services\Media;

/**
 * Interface for video processors (placeholder for future implementation)
 */
interface VideoProcessorInterface
{
    /**
     * Process a video file
     *
     * @param  string  $disk  Storage disk name
     * @param  string  $path  Path to the video file
     * @param  array<string, mixed>  $config  Processing configuration
     * @return array<string, mixed>
     */
    public function process(string $disk, string $path, array $config): array;

    /**
     * Generate a thumbnail from a video
     *
     * @param  string  $disk  Storage disk name
     * @param  string  $path  Path to the video file
     * @return string|null Path to the generated thumbnail, or null if generation failed
     */
    public function generateThumbnail(string $disk, string $path): ?string;

    /**
     * Extract metadata from a video file
     *
     * @param  string  $disk  Storage disk name
     * @param  string  $path  Path to the video file
     * @return array<string, mixed> Metadata including width, height, duration, etc.
     */
    public function extractMetadata(string $disk, string $path): array;
}

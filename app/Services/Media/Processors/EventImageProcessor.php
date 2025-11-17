<?php

namespace App\Services\Media\Processors;

use Intervention\Image\Image;

class EventImageProcessor implements ImageProcessorInterface
{
    private const THUMBNAIL_SIZE = 800;

    public function __construct(
        private string $baseDirectory,
        private string $baseFilename,
    ) {}

    public function process(Image $image): Image
    {
        // For events, we optimize but don't resize the main image
        return $image;
    }

    public function getConfig(): array
    {
        return [
            'base_directory' => $this->baseDirectory,
            'base_filename' => $this->baseFilename,
            'generate_optimized' => true,
            'quality' => 85,
            'generate_thumbnail' => true,
            'thumbnail_size' => self::THUMBNAIL_SIZE,
            'thumbnail_quality' => 80,
            'generate_blur' => true,
            'blur_size' => 20,
            'blur_quality' => 60,
        ];
    }
}

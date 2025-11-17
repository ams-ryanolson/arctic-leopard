<?php

namespace App\Services\Media\Processors;

use Intervention\Image\Image;

class CoverProcessor implements ImageProcessorInterface
{
    private const COVER_HEIGHT = 600;

    public function __construct(
        private string $baseDirectory,
        private string $baseFilename = 'cover',
    ) {}

    public function process(Image $image): Image
    {
        // Resize cover to max height while maintaining aspect ratio
        return $image->scaleDown(height: self::COVER_HEIGHT);
    }

    public function getConfig(): array
    {
        return [
            'base_directory' => $this->baseDirectory,
            'base_filename' => $this->baseFilename,
            'generate_optimized' => true,
            'quality' => 85,
            'generate_thumbnail' => false,
            'generate_blur' => true,
            'blur_size' => 20,
            'blur_quality' => 60,
        ];
    }
}

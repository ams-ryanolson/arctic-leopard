<?php

namespace App\Services\Media\Processors;

use Intervention\Image\Image;

class MessageImageProcessor implements ImageProcessorInterface
{
    public function __construct(
        private string $baseDirectory,
        private string $baseFilename,
    ) {}

    public function process(Image $image): Image
    {
        // For messages, we just optimize without resizing
        return $image;
    }

    public function getConfig(): array
    {
        return [
            'base_directory' => $this->baseDirectory,
            'base_filename' => $this->baseFilename,
            'generate_optimized' => true,
            'quality' => 85,
            'generate_thumbnail' => false,
            'generate_blur' => false,
        ];
    }
}

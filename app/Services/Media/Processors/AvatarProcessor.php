<?php

namespace App\Services\Media\Processors;

use Intervention\Image\Image;

class AvatarProcessor implements ImageProcessorInterface
{
    private const AVATAR_SIZE = 400;

    public function __construct(
        private string $baseDirectory,
        private string $baseFilename = 'avatar',
    ) {}

    public function process(Image $image): Image
    {
        // Resize to square avatar (crop center if needed)
        return $image->cover(self::AVATAR_SIZE, self::AVATAR_SIZE);
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

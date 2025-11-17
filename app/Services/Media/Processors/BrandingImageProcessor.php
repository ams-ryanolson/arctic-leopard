<?php

namespace App\Services\Media\Processors;

use Intervention\Image\Image;

class BrandingImageProcessor implements ImageProcessorInterface
{
    public function __construct(
        private string $baseDirectory,
        private string $baseFilename,
        private string $logoType,
    ) {}

    public function process(Image $image): Image
    {
        // For favicon/app_icon, ensure square format
        if (in_array($this->logoType, ['favicon', 'app_icon'], true)) {
            $size = $this->logoType === 'favicon' ? 32 : 512;
            $image = $image->cover($size, $size);
        }

        return $image;
    }

    public function getConfig(): array
    {
        return [
            'base_directory' => $this->baseDirectory,
            'base_filename' => $this->baseFilename,
            'generate_optimized' => true,
            'quality' => 90, // Higher quality for branding
            'generate_thumbnail' => false,
            'generate_blur' => false,
        ];
    }
}

<?php

namespace App\Services\Media\Processors;

use Intervention\Image\Image;

/**
 * Interface for image processors that define context-specific processing configurations
 */
interface ImageProcessorInterface
{
    /**
     * Process the image according to the processor's configuration
     *
     * @param  Image  $image  The image to process
     * @return Image The processed image
     */
    public function process(Image $image): Image;

    /**
     * Get the processor configuration
     *
     * @return array<string, mixed>
     */
    public function getConfig(): array;
}

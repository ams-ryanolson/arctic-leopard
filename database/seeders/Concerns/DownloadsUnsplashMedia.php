<?php

namespace Database\Seeders\Concerns;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

trait DownloadsUnsplashMedia
{
    /**
     * Directory under the public disk where cached seed media is stored.
     */
    protected string $seedMediaDirectory = 'media/seed';

    /**
     * Retrieve a cached or freshly downloaded Unsplash image and return metadata
     * suitable for seeding a PostMedia record.
     *
     * @param  array<int, string>|string  $topics
     * @return array<string, mixed>|null
     */
    protected function fetchSeedImage(array|string $topics = ['fetish'], string $size = '2048x1365'): ?array
    {
        $topics = Arr::wrap($topics);
        $topics = array_values(array_filter(array_map(static fn ($value) => trim((string) $value), $topics)));

        if ($topics === []) {
            $topics = ['kink'];
        }

        $disk = Storage::disk('public');

        $width = 2048;
        $height = 1365;

        if (str_contains($size, 'x')) {
            [$parsedWidth, $parsedHeight] = array_map('intval', explode('x', $size));

            if ($parsedWidth > 0 && $parsedHeight > 0) {
                $width = $parsedWidth;
                $height = $parsedHeight;
            }
        }

        $existing = $disk->files($this->seedMediaDirectory);

        if ($existing !== [] && fake()->boolean(70)) {
            return $this->buildSeedImageResult(Arr::random($existing), $width, $height);
        }

        $downloadedPath = $this->downloadUnsplashImage($topics, $size);

        if ($downloadedPath !== null) {
            return $this->buildSeedImageResult($downloadedPath, $width, $height);
        }

        if ($existing !== []) {
            return $this->buildSeedImageResult(Arr::random($existing), $width, $height);
        }

        $placeholder = $this->generatePlaceholderImage($width, $height);

        return $placeholder
            ? $this->buildSeedImageResult($placeholder, $width, $height)
            : null;
    }

    /**
     * Attempt to download an image from Unsplash and store it locally.
     */
    protected function downloadUnsplashImage(array $topics, string $size): ?string
    {
        $disk = Storage::disk('public');

        $url = sprintf(
            'https://source.unsplash.com/random/%s/?%s',
            $size,
            urlencode(implode(',', $topics)),
        );

        try {
            $response = Http::timeout(10)->retry(2, 250, throw: false)->get($url);
        } catch (ConnectionException $exception) {
            Log::warning('Unsplash seed download failed due to connection error.', [
                'message' => $exception->getMessage(),
                'topics' => $topics,
            ]);

            return null;
        }

        if (! $response->successful()) {
            Log::warning('Unsplash seed download failed.', [
                'status' => $response->status(),
                'topics' => $topics,
            ]);

            return null;
        }

        $hash = md5(Str::uuid()->toString().microtime(true));
        $filename = $this->seedMediaDirectory.'/'.$hash.'.jpg';

        $disk->put($filename, $response->body());

        return $filename;
    }

    /**
     * Build the structure used by the seeder for PostMedia factories.
     *
     * @return array<string, mixed>
     */
    protected function buildSeedImageResult(string $path, int $width, int $height): array
    {
        return [
            'disk' => 'public',
            'path' => $path,
            'thumbnail_path' => $path,
            'mime_type' => 'image/jpeg',
            'width' => $width,
            'height' => $height,
            'duration' => null,
            'meta' => [],
        ];
    }

    /**
     * Generate a simple placeholder image when remote downloads are unavailable.
     */
    protected function generatePlaceholderImage(int $width, int $height): ?string
    {
        if (! function_exists('imagecreatetruecolor')) {
            return null;
        }

        $image = imagecreatetruecolor($width, $height);

        $background = imagecolorallocate(
            $image,
            fake()->numberBetween(30, 90),
            fake()->numberBetween(30, 90),
            fake()->numberBetween(30, 90),
        );

        imagefill($image, 0, 0, $background);

        $accent = imagecolorallocate(
            $image,
            fake()->numberBetween(150, 220),
            fake()->numberBetween(150, 220),
            fake()->numberBetween(150, 220),
        );

        imagesetthickness($image, 6);
        imagerectangle($image, 8, 8, $width - 8, $height - 8, $accent);

        $hash = md5(Str::uuid()->toString().microtime(true));
        $filename = $this->seedMediaDirectory.'/'.$hash.'.jpg';

        ob_start();
        imagejpeg($image, quality: 75);
        imagedestroy($image);

        $contents = ob_get_clean();

        if ($contents === false) {
            return null;
        }

        Storage::disk('public')->put($filename, $contents);

        return $filename;
    }
}


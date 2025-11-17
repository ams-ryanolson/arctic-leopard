<?php

namespace App\Services\Users;

use App\Models\User;
use App\Services\TemporaryUploadService;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;
use Throwable;

class UserMediaService
{
    private const AVATAR_SIZE = 400;

    private const COVER_HEIGHT = 600;

    private const BLUR_SIZE = 20;

    public function __construct(
        private TemporaryUploadService $temporaryUploads,
    ) {}

    private function imageManager(): ImageManager
    {
        return new ImageManager(new Driver);
    }

    /**
     * Update user avatar from temporary upload
     */
    public function updateAvatar(User $user, string $identifier): ?string
    {
        $disk = config('filesystems.default');

        // Promote file from temporary to permanent storage
        $promotedPath = $this->temporaryUploads->promote(
            $identifier,
            sprintf('users/%d', $user->getKey()),
            'avatar',
            'public',
        );

        if ($promotedPath === null) {
            return null;
        }

        $originalPath = $promotedPath;
        $optimizedPath = null;

        // Process avatar image
        try {
            $processed = $this->processAvatar($disk, $promotedPath, $user->getKey());
            $optimizedPath = $processed['optimized_path'];

            // Use optimized path as the main path
            $promotedPath = $optimizedPath ?? $promotedPath;
        } catch (Throwable $e) {
            // If processing fails, use original
            $promotedPath = $originalPath;
        }

        // Delete old avatar if exists
        if ($user->avatar_path && $user->avatar_path !== $promotedPath) {
            $this->deleteMedia($user->avatar_path);
        }

        return $promotedPath;
    }

    /**
     * Update user cover from temporary upload
     */
    public function updateCover(User $user, string $identifier): ?string
    {
        $disk = config('filesystems.default');

        // Promote file from temporary to permanent storage
        $promotedPath = $this->temporaryUploads->promote(
            $identifier,
            sprintf('users/%d', $user->getKey()),
            'cover',
            'public',
        );

        if ($promotedPath === null) {
            return null;
        }

        $originalPath = $promotedPath;
        $optimizedPath = null;

        // Process cover image
        try {
            $processed = $this->processCover($disk, $promotedPath, $user->getKey());
            $optimizedPath = $processed['optimized_path'];

            // Use optimized path as the main path
            $promotedPath = $optimizedPath ?? $promotedPath;
        } catch (Throwable $e) {
            // If processing fails, use original
            $promotedPath = $originalPath;
        }

        // Delete old cover if exists
        if ($user->cover_path && $user->cover_path !== $promotedPath) {
            $this->deleteMedia($user->cover_path);
        }

        return $promotedPath;
    }

    /**
     * Process avatar image: optimize and resize
     *
     * @return array{optimized_path: string|null}
     */
    private function processAvatar(string $disk, string $path, int $userId): array
    {
        $storage = Storage::disk($disk);
        $imageContents = $storage->get($path);

        if (! is_string($imageContents)) {
            throw new \RuntimeException('Unable to read image file');
        }

        $imageManager = $this->imageManager();
        $image = $imageManager->read($imageContents);

        // Resize to square avatar (crop center if needed)
        $image = $image->cover(self::AVATAR_SIZE, self::AVATAR_SIZE);

        $baseDir = sprintf('users/%d', $userId);
        $baseName = 'avatar';

        // Optimize: Convert to WebP with quality 85
        $optimizedPath = sprintf('%s/%s-optimized.webp', $baseDir, $baseName);
        $optimized = $image->toWebp(85);
        $storage->put($optimizedPath, $optimized->toString(), ['visibility' => 'public']);

        return [
            'optimized_path' => $optimizedPath,
        ];
    }

    /**
     * Process cover image: optimize and resize
     *
     * @return array{optimized_path: string|null}
     */
    private function processCover(string $disk, string $path, int $userId): array
    {
        $storage = Storage::disk($disk);
        $imageContents = $storage->get($path);

        if (! is_string($imageContents)) {
            throw new \RuntimeException('Unable to read image file');
        }

        $imageManager = $this->imageManager();
        $image = $imageManager->read($imageContents);

        // Resize cover to max height while maintaining aspect ratio
        $image = $image->scaleDown(height: self::COVER_HEIGHT);

        $baseDir = sprintf('users/%d', $userId);
        $baseName = 'cover';

        // Optimize: Convert to WebP with quality 85
        $optimizedPath = sprintf('%s/%s-optimized.webp', $baseDir, $baseName);
        $optimized = $image->toWebp(85);
        $storage->put($optimizedPath, $optimized->toString(), ['visibility' => 'public']);

        return [
            'optimized_path' => $optimizedPath,
        ];
    }

    /**
     * Process branding image: optimize
     *
     * @return array{optimized_path: string|null}
     */
    public function processBrandingImage(string $disk, string $path, string $logoType): array
    {
        $storage = Storage::disk($disk);
        $imageContents = $storage->get($path);

        if (! is_string($imageContents)) {
            throw new \RuntimeException('Unable to read image file');
        }

        $imageManager = $this->imageManager();
        $image = $imageManager->read($imageContents);

        // For favicon/app_icon, ensure square format
        if (in_array($logoType, ['favicon', 'app_icon'], true)) {
            $size = $logoType === 'favicon' ? 32 : 512;
            $image = $image->cover($size, $size);
        }

        $baseDir = 'branding';
        $baseName = pathinfo($path, PATHINFO_FILENAME);

        // Optimize: Convert to WebP with quality 90 (higher for branding)
        $optimizedPath = sprintf('%s/%s-optimized.webp', $baseDir, $baseName);
        $optimized = $image->toWebp(90);
        $storage->put($optimizedPath, $optimized->toString(), ['visibility' => 'public']);

        return [
            'optimized_path' => $optimizedPath,
        ];
    }

    private function deleteMedia(?string $path): void
    {
        if (! $path) {
            return;
        }

        $disk = Storage::disk(config('filesystems.default'));

        if ($disk->exists($path)) {
            $disk->delete($path);
        }
    }
}

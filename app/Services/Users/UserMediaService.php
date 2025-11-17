<?php

namespace App\Services\Users;

use App\Models\User;
use App\Services\Media\MediaProcessingService;
use App\Services\Media\Processors\AvatarProcessor;
use App\Services\Media\Processors\BrandingImageProcessor;
use App\Services\Media\Processors\CoverProcessor;
use App\Services\TemporaryUploadService;
use Illuminate\Support\Facades\Storage;
use Throwable;

class UserMediaService
{
    public function __construct(
        private TemporaryUploadService $temporaryUploads,
        private MediaProcessingService $mediaProcessing,
    ) {}

    /**
     * Update user avatar from temporary upload
     */
    public function updateAvatar(User $user, string $identifier): ?string
    {
        $disk = config('filesystems.default');
        $baseDirectory = sprintf('users/%d', $user->getKey());

        // Promote file from temporary to permanent storage
        $promotedPath = $this->temporaryUploads->promote(
            $identifier,
            $baseDirectory,
            'avatar',
            'public',
        );

        if ($promotedPath === null) {
            return null;
        }

        $originalPath = $promotedPath;
        $optimizedPath = null;

        // Process avatar image using unified MediaProcessingService
        try {
            $processor = new AvatarProcessor($baseDirectory, 'avatar');
            $processed = $this->mediaProcessing->processImage($disk, $promotedPath, $processor);
            $optimizedPath = $processed['optimized_path'];

            // Use optimized path as the main path
            $promotedPath = $optimizedPath ?? $promotedPath;
        } catch (Throwable $e) {
            \Log::warning('UserMediaService: Avatar processing failed', [
                'user_id' => $user->getKey(),
                'path' => $promotedPath,
                'error' => $e->getMessage(),
            ]);
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
        $baseDirectory = sprintf('users/%d', $user->getKey());

        // Promote file from temporary to permanent storage
        $promotedPath = $this->temporaryUploads->promote(
            $identifier,
            $baseDirectory,
            'cover',
            'public',
        );

        if ($promotedPath === null) {
            return null;
        }

        $originalPath = $promotedPath;
        $optimizedPath = null;

        // Process cover image using unified MediaProcessingService
        try {
            $processor = new CoverProcessor($baseDirectory, 'cover');
            $processed = $this->mediaProcessing->processImage($disk, $promotedPath, $processor);
            $optimizedPath = $processed['optimized_path'];

            // Use optimized path as the main path
            $promotedPath = $optimizedPath ?? $promotedPath;
        } catch (Throwable $e) {
            \Log::warning('UserMediaService: Cover processing failed', [
                'user_id' => $user->getKey(),
                'path' => $promotedPath,
                'error' => $e->getMessage(),
            ]);
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
     * Process branding image: optimize
     *
     * @return array{optimized_path: string|null}
     */
    public function processBrandingImage(string $disk, string $path, string $logoType): array
    {
        $baseDir = 'branding';
        $baseName = pathinfo($path, PATHINFO_FILENAME);

        try {
            $processor = new BrandingImageProcessor($baseDir, $baseName, $logoType);
            $processed = $this->mediaProcessing->processImage($disk, $path, $processor);

            return [
                'optimized_path' => $processed['optimized_path'],
            ];
        } catch (Throwable $e) {
            \Log::warning('UserMediaService: Branding image processing failed', [
                'path' => $path,
                'logo_type' => $logoType,
                'error' => $e->getMessage(),
            ]);

            return [
                'optimized_path' => null,
            ];
        }
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

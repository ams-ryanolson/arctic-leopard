<?php

namespace App\Services;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;
use League\Flysystem\UnableToListContents;

class TemporaryUploadService
{
    public function store(UploadedFile $file): array
    {
        $disk = $this->temporaryDisk();
        $disk->makeDirectory($this->temporaryDirectory());

        $identifier = Str::ulid()->toBase32();
        $extension = $file->getClientOriginalExtension();
        $filename = $extension !== '' ? "{$identifier}.{$extension}" : $identifier;

        $path = $file->storeAs($this->temporaryDirectory(), $filename, [
            'disk' => $this->temporaryDiskName(),
            'visibility' => 'private',
        ]);

        return [
            'identifier' => $identifier,
            'filename' => $filename,
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
            'disk' => $this->temporaryDiskName(),
        ];
    }

    public function delete(string $identifier): void
    {
        $disk = $this->temporaryDisk();
        $path = $this->resolvePath($identifier);

        if ($path !== null) {
            $disk->delete($path);
        }
    }

    public function promote(
        string $identifier,
        string $targetDirectory,
        ?string $targetFilename = null,
        string $visibility = 'public',
    ): ?string {
        $sourceDisk = $this->temporaryDisk();
        $sourcePath = $this->resolvePath($identifier);

        if ($sourcePath === null) {
            return null;
        }

        $targetDisk = Storage::disk($this->permanentDiskName());
        $directory = trim($targetDirectory, '/');

        if ($directory !== '' && ! $targetDisk->exists($directory)) {
            $targetDisk->makeDirectory($directory);
        }

        $requestedExtension = $targetFilename !== null ? pathinfo($targetFilename, PATHINFO_EXTENSION) : '';
        $sourceExtension = pathinfo($sourcePath, PATHINFO_EXTENSION);
        $extension = $requestedExtension !== '' ? $requestedExtension : $sourceExtension;
        $extensionSuffix = $extension !== '' ? ".{$extension}" : '';
        $baseName = $targetFilename !== null
            ? pathinfo($targetFilename, PATHINFO_FILENAME)
            : pathinfo($sourcePath, PATHINFO_FILENAME);
        $filename = $baseName . '-' . Str::ulid()->toBase32() . $extensionSuffix;

        $destinationPath = ($directory !== '' ? "{$directory}/" : '') . $filename;

        $stream = $sourceDisk->readStream($sourcePath);

        if ($stream === false) {
            return null;
        }

        $options = ['visibility' => $visibility];
        
        if ($targetDisk->getAdapter() instanceof \League\Flysystem\AwsS3V3\AwsS3V3Adapter) {
            $options['ACL'] = $visibility === 'public' ? 'public-read' : 'private';
        }
        
        $targetDisk->put($destinationPath, $stream, $options);

        if (is_resource($stream)) {
            fclose($stream);
        }

        $sourceDisk->delete($sourcePath);

        return $destinationPath;
    }

    public function stream(string $identifier): ?StreamedResponse
    {
        $disk = $this->temporaryDisk();
        $path = $this->resolvePath($identifier);

        if ($path === null || ! $disk->exists($path)) {
            return null;
        }

        $stream = $disk->readStream($path);

        return response()->stream(function () use ($stream): void {
            fpassthru($stream);
        }, 200, [
            'Content-Type' => $disk->mimeType($path) ?? 'application/octet-stream',
            'Content-Length' => $disk->size($path),
            'Content-Disposition' => 'inline; filename="' . basename($path) . '"',
        ]);
    }

    public function resolvePath(string $identifier): ?string
    {
        $disk = $this->temporaryDisk();
        $directory = $this->temporaryDirectory();

        try {
            foreach ($disk->files($directory) as $file) {
                $basename = pathinfo($file, PATHINFO_FILENAME);

                if ($basename === $identifier) {
                    return $file;
                }
            }
        } catch (UnableToListContents) {
            return null;
        }

        return null;
    }

    public function exists(string $identifier): bool
    {
        return $this->resolvePath($identifier) !== null;
    }

    public function temporaryDisk(): Filesystem
    {
        return Storage::disk($this->temporaryDiskName());
    }

    protected function temporaryDiskName(): string
    {
        return config('uploads.temporary_disk');
    }

    protected function temporaryDirectory(): string
    {
        return trim(config('uploads.temporary_directory'), '/');
    }

    protected function permanentDiskName(): string
    {
        return config('filesystems.default');
    }
}



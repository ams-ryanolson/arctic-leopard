<?php

namespace App\Services;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use League\Flysystem\UnableToListContents;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TemporaryUploadService
{
    public function store(UploadedFile $file): array
    {
        $disk = $this->temporaryDisk();
        $directory = $this->temporaryDirectory();
        $disk->makeDirectory($directory);

        $identifier = Str::ulid()->toBase32();
        $extension = $file->getClientOriginalExtension();
        $filename = $extension !== '' ? "{$identifier}.{$extension}" : $identifier;

        $path = $file->storeAs($directory, $filename, [
            'disk' => $this->temporaryDiskName(),
            'visibility' => 'private',
        ]);

        if ($path === false) {
            \Log::error('TemporaryUploadService: Failed to store file', [
                'identifier' => $identifier,
                'filename' => $filename,
                'directory' => $directory,
                'disk' => $this->temporaryDiskName(),
            ]);
            throw new \RuntimeException('Failed to store temporary upload.');
        }

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
        \Log::info('TemporaryUploadService: promote started', [
            'identifier' => $identifier,
            'target_directory' => $targetDirectory,
            'target_filename' => $targetFilename,
            'visibility' => $visibility,
        ]);

        $sourceDisk = $this->temporaryDisk();
        $sourcePath = $this->resolvePath($identifier);

        if ($sourcePath === null) {
            \Log::warning('TemporaryUploadService: Failed to resolve path for identifier', [
                'identifier' => $identifier,
                'temporary_directory' => $this->temporaryDirectory(),
                'temporary_disk' => $this->temporaryDiskName(),
            ]);

            return null;
        }

        \Log::info('TemporaryUploadService: resolved source path', ['source_path' => $sourcePath]);

        $targetDisk = Storage::disk($this->permanentDiskName());
        $directory = trim($targetDirectory, '/');

        \Log::info('TemporaryUploadService: checking target directory', ['directory' => $directory]);

        if ($directory !== '' && ! $targetDisk->exists($directory)) {
            \Log::info('TemporaryUploadService: creating target directory', ['directory' => $directory]);
            $targetDisk->makeDirectory($directory);
        }

        $requestedExtension = $targetFilename !== null ? pathinfo($targetFilename, PATHINFO_EXTENSION) : '';
        $sourceExtension = pathinfo($sourcePath, PATHINFO_EXTENSION);
        $extension = $requestedExtension !== '' ? $requestedExtension : $sourceExtension;
        $extensionSuffix = $extension !== '' ? ".{$extension}" : '';
        $baseName = $targetFilename !== null
            ? pathinfo($targetFilename, PATHINFO_FILENAME)
            : pathinfo($sourcePath, PATHINFO_FILENAME);
        $filename = $baseName.'-'.Str::ulid()->toBase32().$extensionSuffix;

        $destinationPath = ($directory !== '' ? "{$directory}/" : '').$filename;

        \Log::info('TemporaryUploadService: reading source stream', [
            'source_path' => $sourcePath,
            'destination_path' => $destinationPath,
        ]);

        $stream = $sourceDisk->readStream($sourcePath);

        if ($stream === false) {
            \Log::error('TemporaryUploadService: Failed to read stream for promotion', [
                'identifier' => $identifier,
                'source_path' => $sourcePath,
                'source_disk' => $this->temporaryDiskName(),
                'file_exists' => $sourceDisk->exists($sourcePath),
            ]);

            return null;
        }

        \Log::info('TemporaryUploadService: stream read successfully, uploading to target', [
            'destination_path' => $destinationPath,
        ]);

        $options = ['visibility' => $visibility];

        if ($targetDisk->getAdapter() instanceof \League\Flysystem\AwsS3V3\AwsS3V3Adapter) {
            $options['ACL'] = $visibility === 'public' ? 'public-read' : 'private';
        }

        try {
            $targetDisk->put($destinationPath, $stream, $options);
            \Log::info('TemporaryUploadService: file uploaded successfully', ['destination_path' => $destinationPath]);
        } catch (\Throwable $e) {
            \Log::error('TemporaryUploadService: Failed to upload file', [
                'destination_path' => $destinationPath,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            if (is_resource($stream)) {
                fclose($stream);
            }

            return null;
        }

        // Explicitly set visibility after upload to ensure it's applied (important for S3/MinIO)
        try {
            $targetDisk->setVisibility($destinationPath, $visibility);
            \Log::info('TemporaryUploadService: visibility set successfully', [
                'destination_path' => $destinationPath,
                'visibility' => $visibility,
            ]);
        } catch (\Throwable $e) {
            \Log::warning('TemporaryUploadService: Failed to set visibility after promotion', [
                'path' => $destinationPath,
                'visibility' => $visibility,
                'error' => $e->getMessage(),
            ]);
        }

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
            'Content-Disposition' => 'inline; filename="'.basename($path).'"',
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

<?php

namespace App\Console\Commands;

use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CleanupTemporaryUploads extends Command
{
    protected $signature = 'uploads:clean-temp {--dry : List files without deleting them}';

    protected $description = 'Delete expired temporary uploads created via FilePond.';

    public function handle(): int
    {
        $diskName = config('uploads.temporary_disk');
        $directory = trim(config('uploads.temporary_directory'), '/');
        $ttlMinutes = (int) config('uploads.temporary_ttl_minutes', 60);
        $expiresBefore = CarbonImmutable::now()->subMinutes($ttlMinutes);
        $dryRun = (bool) $this->option('dry');

        $disk = Storage::disk($diskName);

        if (! $disk->exists($directory)) {
            $this->info('No temporary upload directory found.');

            return self::SUCCESS;
        }

        $deleted = 0;
        $files = $disk->allFiles($directory);

        foreach ($files as $file) {
            $lastModified = CarbonImmutable::createFromTimestamp($disk->lastModified($file));

            if ($lastModified->greaterThanOrEqualTo($expiresBefore)) {
                continue;
            }

            if ($dryRun) {
                $this->line("[DRY] Would delete {$file} (last modified {$lastModified->toDateTimeString()})");
                continue;
            }

            $disk->delete($file);
            $deleted++;
        }

        if ($dryRun) {
            $this->info(sprintf('Dry run complete. %d files older than %d minutes.', count($files), $ttlMinutes));

            return self::SUCCESS;
        }

        $this->info(sprintf('Deleted %d temporary uploads older than %d minutes.', $deleted, $ttlMinutes));

        return self::SUCCESS;
    }
}






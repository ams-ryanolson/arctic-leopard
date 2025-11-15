<?php

namespace App\Console\Commands;

use App\Models\UserDataExport;
use Illuminate\Console\Command;

class CleanupExpiredExports extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'exports:cleanup-expired {--dry-run : Show what would be deleted without actually deleting}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete expired data exports and their files from storage';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');

        $expiredExports = UserDataExport::where('expires_at', '<', now())
            ->orWhere(function ($query) {
                $query->whereNotNull('expires_at')
                    ->where('expires_at', '<', now());
            })
            ->get();

        if ($expiredExports->isEmpty()) {
            $this->info('No expired exports found.');

            return Command::SUCCESS;
        }

        $this->info(sprintf('Found %d expired export(s).', $expiredExports->count()));

        $deletedCount = 0;
        $failedCount = 0;

        foreach ($expiredExports as $export) {
            if ($dryRun) {
                $this->line(sprintf('Would delete export ID %d (expired: %s)', $export->id, $export->expires_at?->toDateTimeString()));
                $deletedCount++;
            } else {
                try {
                    // Delete the file from storage
                    $export->deleteFile();

                    // Delete the database record
                    $export->delete();

                    $deletedCount++;
                } catch (\Exception $e) {
                    $this->error(sprintf('Failed to delete export ID %d: %s', $export->id, $e->getMessage()));
                    $failedCount++;
                }
            }
        }

        if ($dryRun) {
            $this->info(sprintf('Dry run: Would delete %d export(s).', $deletedCount));
        } else {
            $this->info(sprintf('Deleted %d export(s).', $deletedCount));
            if ($failedCount > 0) {
                $this->warn(sprintf('Failed to delete %d export(s).', $failedCount));
            }
        }

        return Command::SUCCESS;
    }
}

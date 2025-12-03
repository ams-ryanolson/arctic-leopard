<?php

namespace App\Console\Commands;

use App\Models\MigrationMapping;
use App\Models\Post;
use App\Models\PostMedia;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class FixVideoMimeTypes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:fix-video-mime-types
                            {--batch-size=100 : Number of records to process per batch}
                            {--limit= : Maximum number of records to fix (for testing)}
                            {--dry-run : Show what would be fixed without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix MIME types for migrated videos that are missing or incorrect';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $batchSize = (int) $this->option('batch-size');
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;
        $dryRun = $this->option('dry-run');

        $this->info('Finding migrated videos with incorrect MIME types...');

        // Find PostMedia records that belong to posts migrated from SE4 videos
        $migratedPostIds = MigrationMapping::query()
            ->where('source_type', 'video')
            ->where('target_type', Post::class)
            ->pluck('target_id')
            ->unique();

        // Find PostMedia records that:
        // 1. Belong to migrated video posts
        // 2. Have MIME type that is null, empty, or doesn't start with 'video/'
        $query = PostMedia::query()
            ->whereIn('post_id', $migratedPostIds)
            ->where(function ($q) {
                $q->whereNull('mime_type')
                    ->orWhere('mime_type', '')
                    ->orWhere('mime_type', 'not like', 'video/%');
            });

        $total = $query->count();

        if ($limit) {
            $total = min($total, $limit);
        }

        if ($total === 0) {
            $this->info('No videos found with incorrect MIME types.');

            return Command::SUCCESS;
        }

        $this->info("Found {$total} videos with incorrect MIME types");

        if ($dryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
        } elseif (! $this->confirm('Continue?', true)) {
            return Command::FAILURE;
        }

        $progressBar = $this->output->createProgressBar($total);
        $progressBar->start();

        $processed = 0;
        $fixed = 0;
        $errors = 0;
        $offset = 0;

        while ($processed < $total) {
            $batch = $query->limit($batchSize)->offset($offset)->get();

            if ($batch->isEmpty()) {
                break;
            }

            foreach ($batch as $media) {
                try {
                    $newMimeType = $this->inferMimeType($media->path);

                    if ($newMimeType && $newMimeType !== $media->mime_type) {
                        if (! $dryRun) {
                            $media->update(['mime_type' => $newMimeType]);
                        }
                        $fixed++;
                    }
                    $processed++;
                } catch (\Exception $e) {
                    $this->newLine();
                    $this->error("Error fixing media {$media->id}: {$e->getMessage()}");
                    $errors++;
                }

                $progressBar->advance();

                if ($limit && $processed >= $limit) {
                    break 2;
                }
            }

            $offset += $batchSize;
        }

        $progressBar->finish();
        $this->newLine(2);

        $this->info('Fix complete!');
        $this->table(
            ['Status', 'Count'],
            [
                ['Processed', $processed],
                ['Fixed', $fixed],
                ['Errors', $errors],
                ['Total', $processed + $errors],
            ]
        );

        if ($dryRun && $fixed > 0) {
            $this->newLine();
            $this->info("Would fix {$fixed} MIME types. Run without --dry-run to apply changes.");
        }

        return $errors > 0 ? Command::FAILURE : Command::SUCCESS;
    }

    /**
     * Infer MIME type from file path/URL.
     */
    protected function inferMimeType(?string $path): ?string
    {
        if (empty($path)) {
            return 'video/mp4'; // Default fallback
        }

        // Extract extension from path/URL
        $extension = strtolower(Str::afterLast($path, '.'));

        // Remove query parameters if present
        $extension = Str::before($extension, '?');

        $extensionMimeMap = [
            'mp4' => 'video/mp4',
            'webm' => 'video/webm',
            'mov' => 'video/quicktime',
            'avi' => 'video/x-msvideo',
            'flv' => 'video/x-flv',
            'wmv' => 'video/x-ms-wmv',
            'mkv' => 'video/x-matroska',
            'm4v' => 'video/mp4',
            '3gp' => 'video/3gpp',
        ];

        return $extensionMimeMap[$extension] ?? 'video/mp4';
    }
}

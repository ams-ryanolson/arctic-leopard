<?php

namespace App\Console\Commands;

use App\Models\MigrationMapping;
use App\Models\Post;
use App\Models\PostMedia;
use App\Models\SE4StorageFile;
use App\Models\SE4Video;
use Illuminate\Console\Command;

class FixVideoThumbnails extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:fix-video-thumbnails
                            {--batch-size=100 : Number of records to process per batch}
                            {--limit= : Maximum number of records to fix (for testing)}
                            {--dry-run : Show what would be fixed without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix thumbnails for migrated videos that are missing them';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $batchSize = (int) $this->option('batch-size');
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;
        $dryRun = $this->option('dry-run');

        $this->info('Finding migrated videos without thumbnails...');

        // Find PostMedia records that belong to posts migrated from SE4 videos
        $migratedPostIds = MigrationMapping::query()
            ->where('source_type', 'video')
            ->where('target_type', Post::class)
            ->pluck('target_id')
            ->unique();

        // Find PostMedia records that:
        // 1. Belong to migrated video posts
        // 2. Don't have a thumbnail_path
        $query = PostMedia::query()
            ->whereIn('post_id', $migratedPostIds)
            ->where(function ($q) {
                $q->whereNull('thumbnail_path')
                    ->orWhere('thumbnail_path', '');
            });

        $total = $query->count();

        if ($limit) {
            $total = min($total, $limit);
        }

        if ($total === 0) {
            $this->info('No videos found without thumbnails.');

            return Command::SUCCESS;
        }

        $this->info("Found {$total} videos without thumbnails");

        if ($dryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
        } elseif (! $this->confirm('Continue?', true)) {
            return Command::FAILURE;
        }

        $progressBar = $this->output->createProgressBar($total);
        $progressBar->start();

        $processed = 0;
        $fixed = 0;
        $skipped = 0;
        $errors = 0;
        $offset = 0;

        while ($processed < $total) {
            $batch = $query->limit($batchSize)->offset($offset)->get();

            if ($batch->isEmpty()) {
                break;
            }

            foreach ($batch as $media) {
                try {
                    // Get SE4 video_id from migration mapping
                    $post = $media->post;
                    if (! $post) {
                        $skipped++;
                        $processed++;
                        $progressBar->advance();

                        continue;
                    }

                    $mapping = MigrationMapping::query()
                        ->where('source_type', 'video')
                        ->where('target_type', Post::class)
                        ->where('target_id', $post->id)
                        ->first();

                    if (! $mapping) {
                        $skipped++;
                        $processed++;
                        $progressBar->advance();

                        continue;
                    }

                    $se4VideoId = $mapping->source_id;

                    // Get SE4 video to find photo_id
                    $se4Video = SE4Video::find($se4VideoId);
                    if (! $se4Video || ! $se4Video->photo_id) {
                        $skipped++;
                        $processed++;
                        $progressBar->advance();

                        continue;
                    }

                    // Get thumbnail storage file
                    $thumbnailStorageFile = SE4StorageFile::where('file_id', $se4Video->photo_id)
                        ->where('service_id', 14)
                        ->first();

                    if (! $thumbnailStorageFile) {
                        $skipped++;
                        $processed++;
                        $progressBar->advance();

                        continue;
                    }

                    $thumbnailUrl = $thumbnailStorageFile->getCdnUrl();

                    if (! $dryRun) {
                        $media->update(['thumbnail_path' => $thumbnailUrl]);
                    }
                    $fixed++;
                    $processed++;
                } catch (\Exception $e) {
                    $this->newLine();
                    $this->error("Error fixing media {$media->id}: {$e->getMessage()}");
                    $errors++;
                    $processed++;
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
                ['Skipped', $skipped],
                ['Errors', $errors],
                ['Total', $processed],
            ]
        );

        if ($dryRun && $fixed > 0) {
            $this->newLine();
            $this->info("Would fix {$fixed} thumbnails. Run without --dry-run to apply changes.");
        }

        return $errors > 0 ? Command::FAILURE : Command::SUCCESS;
    }
}

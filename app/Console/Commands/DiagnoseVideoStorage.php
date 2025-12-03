<?php

namespace App\Console\Commands;

use App\Models\SE4StorageFile;
use App\Models\SE4Video;
use Illuminate\Console\Command;

class DiagnoseVideoStorage extends Command
{
    protected $signature = 'migrate:diagnose-video-storage {--limit=100 : Number of videos to check}';

    protected $description = 'Diagnose video storage file relationships';

    public function handle(): int
    {
        $limit = (int) $this->option('limit');

        $this->info("Checking video storage relationships...\n");

        // Get videos
        $videos = SE4Video::where('approve', 1)
            ->limit($limit)
            ->get();

        $this->info("Checking {$videos->count()} videos...\n");

        $hasStorage = 0;
        $noStorage = 0;
        $serviceId14 = 0;
        $otherServiceIds = [];

        foreach ($videos as $video) {
            if (! $video->file_id || $video->file_id == 0) {
                $noStorage++;

                continue;
            }

            $storageFile = SE4StorageFile::where('file_id', $video->file_id)->first();

            if (! $storageFile) {
                $noStorage++;

                continue;
            }

            $hasStorage++;

            if ($storageFile->service_id == 14) {
                $serviceId14++;
            } else {
                if (! isset($otherServiceIds[$storageFile->service_id])) {
                    $otherServiceIds[$storageFile->service_id] = 0;
                }
                $otherServiceIds[$storageFile->service_id]++;
            }
        }

        $this->table(
            ['Status', 'Count'],
            [
                ['Videos with storage files', $hasStorage],
                ['Videos without storage files', $noStorage],
                ['Videos with service_id = 14', $serviceId14],
                ['Videos with other service_ids', array_sum($otherServiceIds)],
            ]
        );

        if (! empty($otherServiceIds)) {
            $this->info("\nService ID distribution:");
            foreach ($otherServiceIds as $serviceId => $count) {
                $this->line("  Service ID {$serviceId}: {$count} videos");
            }
        }

        // Show examples
        $this->info("\nExample videos with storage files:");
        $examples = SE4Video::where('approve', 1)
            ->whereNotNull('file_id')
            ->where('file_id', '!=', 0)
            ->limit(5)
            ->get();

        foreach ($examples as $video) {
            $storageFile = SE4StorageFile::where('file_id', $video->file_id)->first();
            if ($storageFile) {
                $this->line("  Video {$video->video_id}: file_id={$video->file_id}, service_id={$storageFile->service_id}, path={$storageFile->storage_path}");
            }
        }

        return Command::SUCCESS;
    }
}

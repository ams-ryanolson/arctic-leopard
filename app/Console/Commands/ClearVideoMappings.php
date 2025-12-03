<?php

namespace App\Console\Commands;

use App\Models\MigrationMapping;
use Illuminate\Console\Command;

class ClearVideoMappings extends Command
{
    protected $signature = 'migrate:clear-video-mappings';

    protected $description = 'Clear video migration mappings (use after database restore)';

    public function handle(): int
    {
        $count = MigrationMapping::where('source_type', 'video')->count();

        if ($count === 0) {
            $this->info('No video mappings found.');

            return Command::SUCCESS;
        }

        if (! $this->confirm("Delete {$count} video migration mappings?", true)) {
            return Command::FAILURE;
        }

        MigrationMapping::where('source_type', 'video')->delete();

        $this->info("Deleted {$count} video mappings.");

        return Command::SUCCESS;
    }
}

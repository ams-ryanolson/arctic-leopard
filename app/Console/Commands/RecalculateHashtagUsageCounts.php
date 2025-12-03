<?php

namespace App\Console\Commands;

use App\Models\Hashtag;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RecalculateHashtagUsageCounts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hashtags:recalculate-usage-counts {--dry-run : Show what would be changed without actually updating}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculate hashtag usage_count based on actual post_hashtag pivot table entries (excluding soft-deleted posts)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->info('🔍 DRY RUN MODE - No changes will be made');
            $this->newLine();
        }

        $this->info('Recalculating hashtag usage counts...');
        $this->newLine();

        $hashtags = Hashtag::all();
        $total = $hashtags->count();
        $updated = 0;
        $unchanged = 0;
        $differences = [];

        $progressBar = $this->output->createProgressBar($total);
        $progressBar->start();

        foreach ($hashtags as $hashtag) {
            // Count actual post_hashtag entries where posts are not soft-deleted
            $actualCount = DB::table('post_hashtag')
                ->join('posts', 'post_hashtag.post_id', '=', 'posts.id')
                ->where('post_hashtag.hashtag_id', $hashtag->id)
                ->whereNull('posts.deleted_at')
                ->distinct('post_hashtag.post_id')
                ->count('post_hashtag.post_id');

            $currentCount = $hashtag->usage_count;

            if ($actualCount !== $currentCount) {
                $differences[] = [
                    'hashtag' => $hashtag->name,
                    'slug' => $hashtag->slug,
                    'current' => $currentCount,
                    'actual' => $actualCount,
                    'difference' => $actualCount - $currentCount,
                ];

                if (! $isDryRun) {
                    $hashtag->update(['usage_count' => $actualCount]);
                }

                $updated++;
            } else {
                $unchanged++;
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine(2);

        // Summary
        $this->info('✅ Completed!');
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Hashtags', number_format($total)],
                ['Updated', number_format($updated)],
                ['Unchanged', number_format($unchanged)],
            ]
        );

        if (! empty($differences)) {
            $this->newLine();
            $this->warn('Hashtags with differences:');
            $this->table(
                ['Hashtag', 'Slug', 'Current Count', 'Actual Count', 'Difference'],
                array_map(
                    static fn (array $diff) => [
                        $diff['hashtag'],
                        $diff['slug'],
                        number_format($diff['current']),
                        number_format($diff['actual']),
                        sprintf('%s%d', $diff['difference'] > 0 ? '+' : '', $diff['difference']),
                    ],
                    $differences
                )
            );
        } else {
            $this->info('✨ All hashtag usage counts are accurate!');
        }

        if ($isDryRun) {
            $this->newLine();
            $this->warn('This was a dry run. Run without --dry-run to apply changes.');
        }

        return Command::SUCCESS;
    }
}

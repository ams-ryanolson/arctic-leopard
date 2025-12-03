<?php

namespace App\Console\Commands;

use App\Enums\TimelineVisibilitySource;
use App\Events\PostPublished;
use App\Models\MigrationMapping;
use App\Models\Post;
use App\Models\Timeline;
use App\Services\Cache\PostCacheService;
use App\Services\Cache\TimelineCacheService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixMigratedPostsTimelines extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:fix-timelines
                            {--batch-size=100 : Number of posts to process per batch}
                            {--limit= : Maximum number of posts to fix (for testing)}
                            {--fan-out : Also fan out to followers/subscribers (slower)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix timeline entries for migrated posts that are missing them';

    public function __construct(
        private PostCacheService $postCache,
        private TimelineCacheService $timelineCache,
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $batchSize = (int) $this->option('batch-size');
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;
        $fanOut = $this->option('fan-out');

        $this->info('Finding posts without timeline entries...');

        // Find posts that don't have timeline entries
        // Check for posts that have migration mappings (migrated from SE4) but no timeline entry
        $migratedPostIds = MigrationMapping::query()
            ->where('source_type', 'video')
            ->where('target_type', Post::class)
            ->pluck('target_id')
            ->unique();

        $query = Post::query()
            ->whereIn('id', $migratedPostIds)
            ->whereDoesntHave('timelineEntries');

        $total = $query->count();

        if ($limit) {
            $total = min($total, $limit);
        }

        if ($total === 0) {
            $this->info('No posts found that need timeline entries.');

            return Command::SUCCESS;
        }

        $this->info("Found {$total} posts without timeline entries");

        if (! $this->confirm('Continue?', true)) {
            return Command::FAILURE;
        }

        $progressBar = $this->output->createProgressBar($total);
        $progressBar->start();

        $processed = 0;
        $errors = 0;
        $offset = 0;

        while ($processed < $total) {
            $batch = $query->limit($batchSize)->offset($offset)->get();

            if ($batch->isEmpty()) {
                break;
            }

            foreach ($batch as $post) {
                try {
                    $this->fixPostTimeline($post, $fanOut);
                    $processed++;
                } catch (\Exception $e) {
                    $this->newLine();
                    $this->error("Error fixing post {$post->id}: {$e->getMessage()}");
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
                ['Errors', $errors],
                ['Total', $processed + $errors],
            ]
        );

        return $errors > 0 ? Command::FAILURE : Command::SUCCESS;
    }

    /**
     * Fix timeline entry for a single post.
     */
    protected function fixPostTimeline(Post $post, bool $fanOut): void
    {
        DB::beginTransaction();
        try {
            // Create timeline entry for the author
            Timeline::query()->upsert([
                [
                    'user_id' => $post->user_id,
                    'post_id' => $post->id,
                    'visibility_source' => TimelineVisibilitySource::SelfAuthored->value,
                    'context' => json_encode([]),
                    'visible_at' => $post->published_at ?? $post->created_at,
                    'created_at' => $post->created_at,
                    'updated_at' => $post->updated_at,
                ],
            ], ['user_id', 'post_id'], ['visibility_source', 'context', 'visible_at', 'updated_at']);

            DB::commit();

            // Optionally fan out to followers/subscribers
            if ($fanOut && $post->published_at && $post->published_at->isPast()) {
                PostPublished::dispatch($post, false);
            }

            // Clear caches
            $this->postCache->forget($post);
            $this->timelineCache->forgetForUsers([$post->user_id]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}

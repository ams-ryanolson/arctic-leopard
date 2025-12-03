<?php

namespace App\Console\Commands;

use App\Enums\PostAudience;
use App\Enums\PostType;
use App\Enums\TimelineVisibilitySource;
use App\Events\PostPublished;
use App\Models\MigrationMapping;
use App\Models\Post;
use App\Models\PostMedia;
use App\Models\SE4StorageFile;
use App\Models\SE4Video;
use App\Models\Timeline;
use App\Services\Cache\PostCacheService;
use App\Services\Cache\TimelineCacheService;
use App\Services\Media\Processors\FFmpegVideoProcessor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MigrateVideos extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:videos
                            {--batch-size=50 : Number of videos to process per batch}
                            {--limit= : Maximum number of videos to migrate (for testing)}
                            {--dry-run : Show what would be migrated without making changes}
                            {--start-from= : Start from a specific SE4 video_id}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate videos from SocialEngine 4 to Laravel posts';

    public function __construct(
        private PostCacheService $postCache,
        private TimelineCacheService $timelineCache,
        private FFmpegVideoProcessor $videoProcessor,
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $batchSize = (int) $this->option('batch-size');
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;
        $startFrom = $this->option('start-from') ? (int) $this->option('start-from') : null;

        if ($dryRun) {
            $this->info('🔍 DRY RUN MODE - No changes will be made');
        }

        $this->info('Starting video migration from SocialEngine 4...');

        // Get total count - videos owned by users or with null/empty owner_type and parent_type
        // AND videos must have a valid storage file (file_id exists and has storage file record)
        // Logic: (owner_type = 'user') OR ((owner_type IS NULL OR empty) AND (parent_type IS NULL OR empty))
        $query = SE4Video::query()
            ->where('approve', 1) // Only approved videos
            ->whereNotNull('file_id') // Must have file_id
            ->where('file_id', '!=', 0) // file_id must not be 0
            ->whereExists(function ($subQuery) {
                // Ensure storage file exists
                $subQuery->select(\DB::raw(1))
                    ->from('engine4_storage_files')
                    ->whereColumn('engine4_storage_files.file_id', 'engine4_video_videos.file_id');
            })
            ->where(function ($q) {
                $q->where('owner_type', 'user')
                    ->orWhere(function ($subQ) {
                        $subQ->where(function ($nullQ) {
                            $nullQ->whereNull('owner_type')
                                ->orWhere('owner_type', '');
                        })
                            ->where(function ($nullQ) {
                                $nullQ->whereNull('parent_type')
                                    ->orWhere('parent_type', '');
                            });
                    });
            });

        if ($startFrom) {
            $query->where('video_id', '>=', $startFrom);
        }

        $total = $query->count();

        // Show breakdown for debugging
        $totalVideos = SE4Video::count();
        $userOwned = SE4Video::where('owner_type', 'user')->where('approve', 1)->count();
        $nullOwnerType = SE4Video::where(function ($q) {
            $q->whereNull('owner_type')->orWhere('owner_type', '');
        })
            ->where(function ($q) {
                $q->whereNull('parent_type')->orWhere('parent_type', '');
            })
            ->where('approve', 1)
            ->count();
        $approved = SE4Video::where('approve', 1)->count();

        $this->info('Video breakdown:');
        $this->line("  Total videos in database: {$totalVideos}");
        $this->line("  Approved videos: {$approved}");
        $this->line("  User-owned (owner_type='user'): {$userOwned}");
        $this->line("  Null owner_type + null parent_type: {$nullOwnerType}");
        $this->line("  Total to migrate: {$total}");

        if ($limit) {
            $total = min($total, $limit);
        }

        $this->info("Found {$total} videos to migrate");

        if (! $this->confirm('Continue?', true)) {
            return Command::FAILURE;
        }

        $progressBar = $this->output->createProgressBar($total);
        $progressBar->start();

        $processed = 0;
        $skipped = 0;
        $errors = 0;
        $lastVideoId = $startFrom ?: 0;

        while ($processed < $total) {
            $batch = SE4Video::query()
                ->where('approve', 1)
                ->whereNotNull('file_id')
                ->where('file_id', '!=', 0)
                ->whereExists(function ($subQuery) {
                    // Ensure storage file exists
                    $subQuery->select(\DB::raw(1))
                        ->from('engine4_storage_files')
                        ->whereColumn('engine4_storage_files.file_id', 'engine4_video_videos.file_id');
                })
                ->where(function ($q) {
                    $q->where('owner_type', 'user')
                        ->orWhere(function ($subQ) {
                            $subQ->where(function ($nullQ) {
                                $nullQ->whereNull('owner_type')
                                    ->orWhere('owner_type', '');
                            })
                                ->where(function ($nullQ) {
                                    $nullQ->whereNull('parent_type')
                                        ->orWhere('parent_type', '');
                                });
                        });
                })
                ->where('video_id', '>', $lastVideoId)
                ->orderBy('video_id')
                ->limit($batchSize)
                ->get();

            if ($batch->isEmpty()) {
                break;
            }

            foreach ($batch as $se4Video) {
                try {
                    $result = $this->migrateVideo($se4Video, $dryRun);

                    if ($result === 'skipped') {
                        $skipped++;
                    } elseif ($result === 'error') {
                        $errors++;
                    } else {
                        $processed++;
                    }

                    $lastVideoId = $se4Video->video_id;
                } catch (\Exception $e) {
                    $this->newLine();
                    $this->error("Error migrating video {$se4Video->video_id}: {$e->getMessage()}");
                    $errors++;
                }

                $progressBar->advance();

                if ($limit && ($processed + $skipped + $errors) >= $limit) {
                    break 2;
                }
            }
        }

        $progressBar->finish();
        $this->newLine(2);

        $this->info('Migration complete!');
        $this->table(
            ['Status', 'Count'],
            [
                ['Processed', $processed],
                ['Skipped', $skipped],
                ['Errors', $errors],
                ['Total', $processed + $skipped + $errors],
            ]
        );

        return $errors > 0 ? Command::FAILURE : Command::SUCCESS;
    }

    /**
     * Migrate a single SE4 video to Laravel post.
     */
    protected function migrateVideo(SE4Video $se4Video, bool $dryRun): string
    {
        // Check if already migrated
        $existing = MigrationMapping::getMapping('video', $se4Video->video_id);
        if ($existing) {
            if ($dryRun) {
                $this->newLine();
                $this->line("Video {$se4Video->video_id} already migrated (skipping)");
            }

            return 'skipped';
        }

        // Determine the SE4 user_id
        // If owner_type is 'user' or null/empty (with null/empty parent_type), use owner_id
        $se4UserId = $se4Video->owner_id;

        // Get the Laravel user_id from migration mapping
        $userMapping = MigrationMapping::getMapping('user', $se4UserId);
        if (! $userMapping) {
            $this->newLine();
            $this->warn("Skipping video {$se4Video->video_id}: User {$se4UserId} not migrated");

            return 'skipped';
        }

        $laravelUserId = $userMapping->target_id;

        // Get the storage file - prefer service_id = 14 (CDN), but accept any if 14 doesn't exist
        $storageFile = SE4StorageFile::where('file_id', $se4Video->file_id)
            ->where('service_id', 14)
            ->first();

        // If service_id 14 doesn't exist, try any service_id
        if (! $storageFile) {
            $storageFile = SE4StorageFile::where('file_id', $se4Video->file_id)->first();

            if ($storageFile) {
                $this->newLine();
                $this->warn("Video {$se4Video->video_id}: Using service_id {$storageFile->service_id} instead of 14");
            }
        }

        if (! $storageFile) {
            $this->newLine();
            $this->warn("Skipping video {$se4Video->video_id}: No storage file found for file_id {$se4Video->file_id}");
            // This shouldn't happen since we filter in the query, but log it anyway

            return 'skipped';
        }

        // Get CDN URL for video
        $cdnUrl = $storageFile->getCdnUrl();

        if ($dryRun) {
            $this->newLine();
            $this->line("Would migrate video: {$se4Video->video_id} - {$se4Video->title}");
            $this->line("  User: {$se4Video->owner_id} → {$laravelUserId}");
            $this->line("  Source URL: {$cdnUrl}");
            $this->line('  Duration: '.($se4Video->duration ?: 'N/A').'s');
            $this->line('  Will convert FLV → MP4 and upload to S3');
            $this->line('  Will generate thumbnail at 10% of duration');

            return 'success';
        }

        // Show progress for actual migration
        $this->line("Processing video {$se4Video->video_id}...");

        // Process video: download, convert to MP4, generate thumbnail, upload to S3
        $this->info("Processing video {$se4Video->video_id}...");

        try {
            $baseDir = sprintf('posts/%d', $laravelUserId);
            $baseFilename = 'video-'.$se4Video->video_id.'-'.Str::random(8);

            $processed = $this->videoProcessor->process('cdn', $cdnUrl, [
                'base_directory' => $baseDir,
                'base_filename' => $baseFilename,
            ]);

            $s3VideoPath = $processed['optimized_path'];
            $s3ThumbnailPath = $processed['thumbnail_path'];
            $width = $processed['width'];
            $height = $processed['height'];
            $duration = $processed['duration'] ?? $se4Video->duration;
        } catch (\Exception $e) {
            $this->newLine();
            $this->error("Failed to process video {$se4Video->video_id}: {$e->getMessage()}");
            throw $e;
        }

        DB::beginTransaction();
        try {
            // Create the post
            $post = Post::create([
                'user_id' => $laravelUserId,
                'type' => PostType::Media,
                'audience' => PostAudience::Public, // Default to public, can be adjusted based on video status
                'body' => $se4Video->title ?: ($se4Video->description ?: ''),
                'published_at' => $se4Video->creation_date,
                'created_at' => $se4Video->creation_date,
                'updated_at' => $se4Video->modified_date ?: $se4Video->creation_date,
            ]);

            // Create the post media with S3 paths
            $postMedia = PostMedia::create([
                'post_id' => $post->id,
                'disk' => 's3', // Store on S3/Spaces
                'path' => $s3VideoPath, // S3 path: posts/123/video-456-abc123.mp4
                'original_path' => $cdnUrl, // Keep original CDN URL for reference
                'thumbnail_path' => $s3ThumbnailPath, // S3 path: posts/123/video-456-abc123-thumb.jpg
                'mime_type' => 'video/mp4', // Always MP4 after conversion
                'position' => 0,
                'duration' => $duration,
                'width' => $width,
                'height' => $height,
                'is_primary' => true,
                'processing_status' => 'completed',
                'meta' => [
                    'se4_video_id' => $se4Video->video_id,
                    'se4_file_id' => $se4Video->file_id,
                    'se4_photo_id' => $se4Video->photo_id,
                    'se4_storage_path' => $storageFile->storage_path,
                    'se4_title' => $se4Video->title,
                    'se4_description' => $se4Video->description,
                    'original_cdn_url' => $cdnUrl,
                    'converted_from' => pathinfo($cdnUrl, PATHINFO_EXTENSION),
                ],
            ]);

            // Create timeline entry for the author (so it shows in their profile feed)
            Timeline::query()->upsert([
                [
                    'user_id' => $laravelUserId,
                    'post_id' => $post->id,
                    'visibility_source' => TimelineVisibilitySource::SelfAuthored->value,
                    'context' => json_encode([]),
                    'visible_at' => $post->published_at ?? $post->created_at,
                    'created_at' => $post->created_at,
                    'updated_at' => $post->updated_at,
                ],
            ], ['user_id', 'post_id'], ['visibility_source', 'context', 'visible_at', 'updated_at']);

            // Create migration mapping
            MigrationMapping::setMapping(
                'video',
                $se4Video->video_id,
                Post::class,
                $post->id,
                [
                    'se4_file_id' => $se4Video->file_id,
                    'se4_owner_id' => $se4Video->owner_id,
                    'post_media_id' => $postMedia->id,
                ]
            );

            DB::commit();

            // Dispatch PostPublished event to fan out to followers/subscribers
            // Only if published_at is in the past (not scheduled)
            if ($post->published_at && $post->published_at->isPast()) {
                PostPublished::dispatch($post, false);
            }

            // Clear caches
            $this->postCache->forget($post);
            $this->timelineCache->forgetForUsers([$laravelUserId]);

            return 'success';
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}

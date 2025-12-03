<?php

namespace App\Console\Commands;

use App\Enums\PostAudience;
use App\Enums\PostType;
use App\Enums\TimelineVisibilitySource;
use App\Events\PostPublished;
use App\Models\MigrationMapping;
use App\Models\Post;
use App\Models\PostMedia;
use App\Models\SE4AlbumPhoto;
use App\Models\Timeline;
use App\Services\Cache\PostCacheService;
use App\Services\Cache\TimelineCacheService;
use App\Services\Media\MediaProcessingService;
use App\Services\Media\Processors\PostImageProcessor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MigratePhotos extends Command
{
    protected $signature = 'migrate:photos
                            {--batch-size=50 : Number of users to process per batch}
                            {--limit= : Maximum number of photos to migrate (for testing)}
                            {--dry-run : Show what would be migrated without making changes}
                            {--start-from-user= : Start from a specific SE4 user_id}
                            {--gap-threshold=30 : Gap threshold in minutes for grouping photos}';

    protected $description = 'Migrate photos from SocialEngine 4 to Laravel posts';

    private const MAX_PHOTOS_PER_POST = 6;

    private const GAP_THRESHOLD_DEFAULT = 30; // minutes

    public function __construct(
        private PostCacheService $postCache,
        private TimelineCacheService $timelineCache,
        private MediaProcessingService $mediaProcessing,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $batchSize = (int) $this->option('batch-size');
        $limit = $this->option('limit') ? (int) $this->option('limit') : null;
        $startFromUser = $this->option('start-from-user') ? (int) $this->option('start-from-user') : null;
        $gapThreshold = (int) ($this->option('gap-threshold') ?: self::GAP_THRESHOLD_DEFAULT);

        if ($dryRun) {
            $this->info('🔍 DRY RUN MODE - No changes will be made');
        }

        $this->info("Starting photo migration from SocialEngine 4 (gap threshold: {$gapThreshold} minutes)...");

        // Get list of message attachment photo IDs to exclude
        $excludedPhotoIds = $this->getExcludedPhotoIds();

        $this->info('Excluding '.count($excludedPhotoIds).' photos that are private message attachments');

        // Get all users who have photos (excluding message attachments)
        $usersQuery = DB::connection('se4')
            ->table('engine4_album_photos')
            ->select('owner_id')
            ->whereNotIn('photo_id', $excludedPhotoIds)
            ->whereNotNull('file_id')
            ->where('file_id', '!=', 0)
            ->distinct();

        if ($startFromUser) {
            $usersQuery->where('owner_id', '>=', $startFromUser);
        }

        $userIds = $usersQuery->orderBy('owner_id')->pluck('owner_id');

        $totalUsers = $userIds->count();
        $this->info("Found {$totalUsers} users with photos to migrate");

        if ($totalUsers === 0) {
            $this->info('No users found with photos to migrate.');

            return Command::SUCCESS;
        }

        $processed = 0;
        $skipped = 0;
        $errors = 0;
        $totalPhotos = 0;
        $totalPosts = 0;

        $progressBar = $this->output->createProgressBar($totalUsers);
        $progressBar->start();

        $userBatches = $userIds->chunk($batchSize);

        foreach ($userBatches as $userBatch) {
            foreach ($userBatch as $se4UserId) {
                try {
                    $result = $this->migrateUserPhotos($se4UserId, $excludedPhotoIds, $gapThreshold, $dryRun, $limit ? $limit - $totalPhotos : null);

                    $processed += $result['processed'];
                    $skipped += $result['skipped'];
                    $errors += $result['errors'];
                    $totalPhotos += $result['photos'];
                    $totalPosts += $result['posts'];

                    if ($limit && $totalPhotos >= $limit) {
                        break 2;
                    }
                } catch (\Exception $e) {
                    $this->newLine();
                    $this->error("Error migrating photos for user {$se4UserId}: {$e->getMessage()}");
                    $errors++;
                }

                $progressBar->advance();
            }

            if ($limit && $totalPhotos >= $limit) {
                break;
            }
        }

        $progressBar->finish();
        $this->newLine(2);

        $this->info('Migration complete!');
        $this->table(
            ['Status', 'Count'],
            [
                ['Users Processed', $processed],
                ['Photos Migrated', $totalPhotos],
                ['Posts Created', $totalPosts],
                ['Skipped', $skipped],
                ['Errors', $errors],
            ]
        );

        return $errors > 0 ? Command::FAILURE : Command::SUCCESS;
    }

    protected function getExcludedPhotoIds(): array
    {
        return DB::connection('se4')
            ->table('engine4_messages_messages')
            ->where('attachment_type', 'album_photo')
            ->where('attachment_id', '!=', 0)
            ->distinct()
            ->pluck('attachment_id')
            ->toArray();
    }

    protected function migrateUserPhotos(int $se4UserId, array $excludedPhotoIds, int $gapThreshold, bool $dryRun, ?int $limit): array
    {
        // Get Laravel user ID
        $userMapping = MigrationMapping::getMapping('user', $se4UserId);
        if (! $userMapping) {
            return ['processed' => 0, 'skipped' => 1, 'errors' => 0, 'photos' => 0, 'posts' => 0];
        }

        $laravelUserId = $userMapping->target_id;

        // Get all photos for this user (excluding message attachments)
        $photos = SE4AlbumPhoto::query()
            ->where('owner_id', $se4UserId)
            ->whereNotIn('photo_id', $excludedPhotoIds)
            ->whereNotNull('file_id')
            ->where('file_id', '!=', 0)
            ->whereHas('storageFile')
            ->orderBy('creation_date')
            ->get();

        if ($photos->isEmpty()) {
            return ['processed' => 0, 'skipped' => 0, 'errors' => 0, 'photos' => 0, 'posts' => 0];
        }

        // OPTIMIZATION: Pre-check which photos are already migrated
        $photoIds = $photos->pluck('photo_id')->toArray();
        $existingMappings = MigrationMapping::where('source_type', 'photo')
            ->whereIn('source_id', $photoIds)
            ->pluck('source_id')
            ->toArray();

        // Filter out already migrated photos
        $photos = $photos->reject(fn ($photo) => in_array($photo->photo_id, $existingMappings));
        $skipped += count($existingMappings);

        if ($photos->isEmpty()) {
            return ['processed' => 0, 'skipped' => $skipped, 'errors' => 0, 'photos' => 0, 'posts' => 0];
        }

        // OPTIMIZATION: Pre-fetch storage files to avoid N+1 queries
        $fileIds = $photos->pluck('file_id')->unique()->toArray();
        $storageFiles = SE4StorageFile::whereIn('file_id', $fileIds)
            ->where('service_id', 14)
            ->get()
            ->keyBy('file_id');

        // Attach storage files to photos
        $photos->each(function ($photo) use ($storageFiles) {
            $photo->setRelation('storageFile', $storageFiles->get($photo->file_id));
        });

        if ($limit) {
            $photos = $photos->take($limit);
        }

        // Group photos by time gaps
        $groups = $this->groupPhotosByGaps($photos, $gapThreshold);

        $processed = 0;
        $skipped = 0;
        $errors = 0;
        $totalPosts = 0;

        foreach ($groups as $group) {
            // Split group into chunks of 6
            $chunks = $group->chunk(self::MAX_PHOTOS_PER_POST);

            foreach ($chunks as $chunk) {
                try {
                    $this->migratePhotoChunk($chunk, $laravelUserId, $dryRun);
                    $processed += $chunk->count();
                    $totalPosts++;
                } catch (\Exception $e) {
                    $this->newLine();
                    $this->error("Error migrating photo chunk for user {$se4UserId}: {$e->getMessage()}");
                    $errors += $chunk->count();
                }
            }
        }

        return [
            'processed' => 1,
            'skipped' => $skipped,
            'errors' => $errors,
            'photos' => $processed,
            'posts' => $totalPosts,
        ];
    }

    protected function groupPhotosByGaps($photos, int $gapThreshold): array
    {
        if ($photos->isEmpty()) {
            return [];
        }

        $groups = [];
        $currentGroup = collect([$photos->first()]);

        for ($i = 1; $i < $photos->count(); $i++) {
            $currentPhoto = $photos[$i];
            $previousPhoto = $photos[$i - 1];

            $gapMinutes = $previousPhoto->creation_date->diffInMinutes($currentPhoto->creation_date);

            if ($gapMinutes > $gapThreshold) {
                // Start a new group
                $groups[] = $currentGroup;
                $currentGroup = collect([$currentPhoto]);
            } else {
                // Add to current group
                $currentGroup->push($currentPhoto);
            }
        }

        // Add the last group
        if ($currentGroup->isNotEmpty()) {
            $groups[] = $currentGroup;
        }

        return $groups;
    }

    protected function migratePhotoChunk($photos, int $laravelUserId, bool $dryRun): void
    {
        if ($photos->isEmpty()) {
            return;
        }

        // Use the earliest photo's creation_date for the post
        $postDate = $photos->first()->creation_date;

        if ($dryRun) {
            $this->newLine();
            $this->line("Would create post with {$photos->count()} photos");
            $this->line("  User: {$laravelUserId}");
            $this->line("  Date: {$postDate->toDateTimeString()}");
            foreach ($photos as $photo) {
                $this->line("  - Photo {$photo->photo_id}: {$photo->title}");
            }

            return;
        }

        // OPTIMIZATION: Disable model events during migration
        $originalPostDispatcher = Post::getEventDispatcher();
        Post::unsetEventDispatcher();

        DB::beginTransaction();
        try {
            // Create post with ULID (will be generated automatically)
            $post = Post::create([
                'user_id' => $laravelUserId,
                'type' => PostType::Media,
                'audience' => PostAudience::Public,
                'body' => null,
                'published_at' => $postDate,
                'created_at' => $postDate,
                'updated_at' => $postDate,
            ]);

            // Use ULID for path structure
            $ulid = $post->ulid;
            $baseDir = "posts/{$ulid}";

            $position = 0;
            foreach ($photos as $se4Photo) {
                $this->migratePhoto($se4Photo, $post, $baseDir, $position);
                $position++;
            }

            // Create timeline entry for the author (so it shows in their profile feed)
            Timeline::query()->upsert([
                [
                    'user_id' => $laravelUserId,
                    'post_id' => $post->id,
                    'visibility_source' => TimelineVisibilitySource::SelfAuthored->value,
                    'context' => json_encode([]),
                    'visible_at' => $post->published_at ?? $post->created_at,
                    'created_at' => $postDate,
                    'updated_at' => $postDate,
                ],
            ], ['user_id', 'post_id'], ['visibility_source', 'context', 'visible_at', 'updated_at']);

            // OPTIMIZATION: Don't dispatch events during migration (too slow)
            // event(new PostPublished($post));

            // OPTIMIZATION: Don't clear caches during migration (too slow)
            // $this->postCache->forget($post);
            // $this->timelineCache->forgetForUsers([$laravelUserId]);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        } finally {
            // Re-enable model events
            Post::setEventDispatcher($originalPostDispatcher);
        }
    }

    protected function migratePhoto(SE4AlbumPhoto $se4Photo, Post $post, string $baseDir, int $position): void
    {
        // Get storage file (should already be loaded from pre-fetch)
        $storageFile = $se4Photo->storageFile;
        if (! $storageFile) {
            throw new \RuntimeException("No storage file found for photo {$se4Photo->photo_id}");
        }

        // Get CDN URL
        $cdnUrl = $storageFile->getCdnUrl();

        // Download image from CDN to temporary location
        $tempFile = $this->downloadImageFromCdn($cdnUrl);

        try {
            // OPTIMIZATION: Process image directly from local file (no S3 round-trip!)
            $baseFilename = "photo-{$se4Photo->photo_id}-".Str::random(8);
            $processor = new PostImageProcessor($baseDir, $baseFilename);
            $processed = $this->mediaProcessing->processImageFromFile($tempFile, 's3', $processor);

            // Clean up temp file
            unlink($tempFile);

            // Create PostMedia record
            $postMedia = PostMedia::create([
                'post_id' => $post->id,
                'disk' => 's3',
                'path' => $processed['optimized_path'] ?? $processed['original_path'],
                'original_path' => $cdnUrl,
                'optimized_path' => $processed['optimized_path'],
                'thumbnail_path' => $processed['thumbnail_path'],
                'blur_path' => $processed['blur_path'],
                'mime_type' => $processed['mime_type'],
                'position' => $position,
                'width' => $processed['width'],
                'height' => $processed['height'],
                'size' => $processed['size'],
                'is_primary' => $position === 0,
                'processing_status' => 'completed',
                'meta' => [
                    'se4_photo_id' => $se4Photo->photo_id,
                    'se4_album_id' => $se4Photo->album_id,
                    'se4_file_id' => $se4Photo->file_id,
                    'se4_title' => $se4Photo->title,
                    'se4_description' => $se4Photo->description,
                    'original_cdn_url' => $cdnUrl,
                ],
            ]);

            // Create migration mapping
            MigrationMapping::setMapping('photo', $se4Photo->photo_id, 'PostMedia', $postMedia->id);
        } catch (\Exception $e) {
            // Clean up temp file on error
            if (isset($tempFile) && file_exists($tempFile)) {
                unlink($tempFile);
            }
            throw $e;
        }
    }

    protected function downloadImageFromCdn(string $url): string
    {
        $tempFile = sys_get_temp_dir().'/photo_'.Str::random(16).'.'.pathinfo($url, PATHINFO_EXTENSION);

        $context = stream_context_create([
            'http' => [
                'timeout' => 30,
                'user_agent' => 'Laravel Photo Migration',
            ],
        ]);

        $content = @file_get_contents($url, false, $context);

        if ($content === false) {
            throw new \RuntimeException("Failed to download image from CDN: {$url}");
        }

        file_put_contents($tempFile, $content);

        return $tempFile;
    }
}

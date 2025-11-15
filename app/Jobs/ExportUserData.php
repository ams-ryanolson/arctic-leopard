<?php

namespace App\Jobs;

use App\Enums\UserDataExportStatus;
use App\Models\User;
use App\Models\UserDataExport;
use App\Notifications\DataExportReadyNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;
use ZipArchive;

class ExportUserData implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $userId,
        public int $exportId,
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $user = User::findOrFail($this->userId);
            $export = UserDataExport::findOrFail($this->exportId);

            // Update status to processing
            $export->update(['status' => UserDataExportStatus::Processing]);
        } catch (Throwable $e) {
            Log::error('ExportUserData: Failed to initialize', [
                'user_id' => $this->userId,
                'export_id' => $this->exportId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }

        try {
            $tempDir = storage_path('app/temp/exports/'.$user->id);
            $zipPath = storage_path('app/exports/user-'.$user->id.'-'.now()->format('Y-m-d-His').'.zip');

            // Create temp directory
            if (! is_dir($tempDir)) {
                mkdir($tempDir, 0755, true);
            }

            // Export profile data
            $profileData = [
                'id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'email' => $user->email,
                'display_name' => $user->display_name,
                'pronouns' => $user->pronouns,
                'gender' => $user->gender,
                'role' => $user->role,
                'bio' => $user->bio,
                'birthdate' => $user->birthdate?->toIso8601String(),
                'location_city' => $user->location_city,
                'location_region' => $user->location_region,
                'location_country' => $user->location_country,
                'created_at' => $user->created_at?->toIso8601String(),
                'updated_at' => $user->updated_at?->toIso8601String(),
                'interests' => $user->interests()->pluck('name')->all(),
                'hashtags' => $user->hashtags()->pluck('name')->all(),
            ];
            file_put_contents($tempDir.'/profile.json', json_encode($profileData, JSON_PRETTY_PRINT));

            // Export posts
            $posts = $user->postedPosts()
                ->with(['media', 'comments'])
                ->get()
                ->map(fn ($post) => [
                    'id' => $post->id,
                    'body' => $post->body,
                    'type' => $post->type->value,
                    'audience' => $post->audience->value,
                    'created_at' => $post->created_at?->toIso8601String(),
                    'updated_at' => $post->updated_at?->toIso8601String(),
                    'likes_count' => $post->likes_count,
                    'comments_count' => $post->comments_count,
                ])
                ->all();
            file_put_contents($tempDir.'/posts.json', json_encode($posts, JSON_PRETTY_PRINT));

            // Export messages
            $messages = $user->conversations()
                ->with(['messages.author', 'participants.user'])
                ->get()
                ->map(fn ($conversation) => [
                    'id' => $conversation->id,
                    'type' => $conversation->type,
                    'subject' => $conversation->subject,
                    'messages' => $conversation->messages->map(fn ($message) => [
                        'id' => $message->id,
                        'body' => $message->body,
                        'type' => $message->type,
                        'created_at' => $message->created_at?->toIso8601String(),
                        'author' => $message->author ? [
                            'id' => $message->author->id,
                            'username' => $message->author->username,
                            'display_name' => $message->author->display_name,
                        ] : null,
                    ])->all(),
                ])
                ->all();
            file_put_contents($tempDir.'/messages.json', json_encode($messages, JSON_PRETTY_PRINT));

            // Export notifications
            $notifications = $user->notifications()
                ->get()
                ->map(fn ($notification) => [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'data' => $notification->data,
                    'read_at' => $notification->read_at?->toIso8601String(),
                    'created_at' => $notification->created_at?->toIso8601String(),
                ])
                ->all();
            file_put_contents($tempDir.'/notifications.json', json_encode($notifications, JSON_PRETTY_PRINT));

            // Copy media files
            $mediaDir = $tempDir.'/media';
            if (! is_dir($mediaDir)) {
                mkdir($mediaDir, 0755, true);
            }

            $defaultDisk = Storage::disk(config('filesystems.default'));

            // Copy avatar
            if ($user->avatar_path && $defaultDisk->exists($user->avatar_path)) {
                $extension = pathinfo($user->avatar_path, PATHINFO_EXTENSION) ?: 'jpg';
                $avatarContent = $defaultDisk->get($user->avatar_path);
                if ($avatarContent !== false) {
                    file_put_contents($mediaDir.'/avatar.'.$extension, $avatarContent);
                }
            }

            // Copy cover
            if ($user->cover_path && $defaultDisk->exists($user->cover_path)) {
                $extension = pathinfo($user->cover_path, PATHINFO_EXTENSION) ?: 'jpg';
                $coverContent = $defaultDisk->get($user->cover_path);
                if ($coverContent !== false) {
                    file_put_contents($mediaDir.'/cover.'.$extension, $coverContent);
                }
            }

            // Copy post media
            $postMediaDir = $mediaDir.'/posts';
            if (! is_dir($postMediaDir)) {
                mkdir($postMediaDir, 0755, true);
            }

            $user->postedPosts()->with('media')->chunk(100, function ($posts) use ($postMediaDir) {
                foreach ($posts as $post) {
                    foreach ($post->media as $media) {
                        $disk = $media->disk ?? config('filesystems.default');
                        $storage = Storage::disk($disk);

                        if ($storage->exists($media->path)) {
                            $extension = pathinfo($media->path, PATHINFO_EXTENSION) ?: 'jpg';
                            $filename = 'post-'.$post->id.'-'.$media->id.'.'.$extension;
                            $mediaContent = $storage->get($media->path);
                            if ($mediaContent !== false) {
                                file_put_contents($postMediaDir.'/'.$filename, $mediaContent);
                            }
                        }
                    }
                }
            });

            // Ensure the exports directory exists
            $exportsDir = dirname($zipPath);
            if (! is_dir($exportsDir)) {
                mkdir($exportsDir, 0755, true);
            }

            // Create ZIP file
            $zip = new ZipArchive;
            if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
                $this->addDirectoryToZip($tempDir, $zip, '');
                $zip->close();
            } else {
                throw new \RuntimeException('Failed to create ZIP file: '.$zip->getStatusString());
            }

            // Determine storage disk (use primary storage, which could be S3)
            $disk = config('filesystems.default');
            $storagePath = 'exports/user-'.$user->id.'-'.now()->format('Y-m-d-His').'.zip';

            // Store in primary storage (S3 or local)
            Storage::disk($disk)->put($storagePath, file_get_contents($zipPath));
            $fileSize = filesize($zipPath);

            // Update export record with file information and mark as completed
            $export->update([
                'file_path' => $storagePath,
                'disk' => $disk,
                'file_size' => $fileSize,
                'status' => UserDataExportStatus::Completed,
            ]);

            // Clean up temp files
            $this->deleteDirectory($tempDir);
            if (file_exists($zipPath)) {
                unlink($zipPath);
            }

            // Send notification to user
            $user->notify(new DataExportReadyNotification($user, $export));
        } catch (Throwable $e) {
            Log::error('ExportUserData: Failed during export', [
                'user_id' => $this->userId,
                'export_id' => $this->exportId,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Mark export as failed
            $export = UserDataExport::find($this->exportId);
            if ($export) {
                $export->update(['status' => UserDataExportStatus::Failed]);
            }

            throw $e;
        }
    }

    private function addDirectoryToZip(string $dir, ZipArchive $zip, string $zipPath): void
    {
        $files = scandir($dir);

        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }

            $filePath = $dir.'/'.$file;
            $zipFilePath = $zipPath ? $zipPath.'/'.$file : $file;

            if (is_dir($filePath)) {
                $zip->addEmptyDir($zipFilePath);
                $this->addDirectoryToZip($filePath, $zip, $zipFilePath);
            } else {
                $zip->addFile($filePath, $zipFilePath);
            }
        }
    }

    private function deleteDirectory(string $dir): void
    {
        if (! is_dir($dir)) {
            return;
        }

        $files = array_diff(scandir($dir), ['.', '..']);

        foreach ($files as $file) {
            $filePath = $dir.'/'.$file;
            is_dir($filePath) ? $this->deleteDirectory($filePath) : unlink($filePath);
        }

        rmdir($dir);
    }

    /**
     * Handle a job failure.
     */
    public function failed(?Throwable $exception): void
    {
        $export = UserDataExport::find($this->exportId);
        if ($export) {
            $export->update([
                'status' => UserDataExportStatus::Failed,
            ]);
        }
    }
}

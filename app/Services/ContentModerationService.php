<?php

namespace App\Services;

use App\Models\AdminSetting;
use App\Models\Comment;
use App\Models\ContentModerationQueue;
use App\Models\Post;
use App\Models\Story;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class ContentModerationService
{
    /**
     * Check if moderation is required (feature flag).
     */
    public function isModerationRequired(): bool
    {
        return AdminSetting::get('content_moderation_required', false);
    }

    /**
     * Queue content for moderation.
     */
    public function queueForModeration(Model $content): void
    {
        // Create or update moderation queue entry
        ContentModerationQueue::updateOrCreate(
            [
                'moderatable_type' => $content->getMorphClass(),
                'moderatable_id' => $content->getKey(),
            ],
            [
                'status' => 'pending',
            ]
        );
    }

    /**
     * Approve content.
     */
    public function approve(Model $content, User $moderator, ?string $notes = null): void
    {
        if ($content instanceof Post) {
            $content->approveModeration($moderator, $notes);
        } elseif ($content instanceof Story) {
            $content->approveModeration($moderator, $notes);
        } elseif ($content instanceof Comment) {
            $content->approveModeration($moderator, $notes);
        }

        // Update queue entry
        $queueEntry = ContentModerationQueue::where('moderatable_type', $content->getMorphClass())
            ->where('moderatable_id', $content->getKey())
            ->first();

        if ($queueEntry) {
            $queueEntry->approve($moderator, $notes);
        }

        // Dispatch event for listeners (cache invalidation, logging, etc.)
        \App\Events\Content\ContentApproved::dispatch($content, $moderator);
    }

    /**
     * Reject content.
     */
    public function reject(Model $content, User $moderator, string $reason, ?string $notes = null): void
    {
        if ($content instanceof Post) {
            $content->rejectModeration($moderator, $reason, $notes);
        } elseif ($content instanceof Story) {
            $content->rejectModeration($moderator, $reason, $notes);
        } elseif ($content instanceof Comment) {
            $content->rejectModeration($moderator, $reason, $notes);
        }

        // Update queue entry
        $queueEntry = ContentModerationQueue::where('moderatable_type', $content->getMorphClass())
            ->where('moderatable_id', $content->getKey())
            ->first();

        if ($queueEntry) {
            $queueEntry->reject($moderator, $reason, $notes);
        }

        // Dispatch event for listeners (cache invalidation, logging, etc.)
        \App\Events\Content\ContentRejected::dispatch($content, $moderator, $reason);
    }

    /**
     * Dismiss content from moderation queue.
     */
    public function dismiss(Model $content, User $moderator, ?string $notes = null): void
    {
        $queueEntry = ContentModerationQueue::where('moderatable_type', $content->getMorphClass())
            ->where('moderatable_id', $content->getKey())
            ->first();

        if ($queueEntry) {
            $queueEntry->dismiss($moderator, $notes);
        }

        // Dispatch event for listeners (cache invalidation, logging, etc.)
        \App\Events\Content\ContentDismissed::dispatch($content, $moderator);
    }

    /**
     * Get moderation queue with infinite scroll support.
     *
     * @return LengthAwarePaginator<ContentModerationQueue>
     */
    public function getQueue(Request $request): LengthAwarePaginator
    {
        $query = ContentModerationQueue::query()
            ->with(['moderatable', 'moderatedBy'])
            ->orderBy('created_at', 'desc');

        // Filter by type
        if ($request->filled('type')) {
            $type = $request->string('type');
            $morphClass = match ($type) {
                'post' => Post::class,
                'story' => Story::class,
                'comment' => Comment::class,
                default => null,
            };

            if ($morphClass) {
                $query->where('moderatable_type', $morphClass);
            }
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->whereHasMorph('moderatable', [Post::class], function ($q) use ($search): void {
                    $q->where('body', 'like', "%{$search}%");
                })
                    ->orWhereHasMorph('moderatable', [Comment::class], function ($q) use ($search): void {
                        $q->where('body', 'like', "%{$search}%");
                    });
            });
        }

        return $query->paginate($request->integer('per_page', 20));
    }
}

<?php

namespace App\Services\Stories;

use App\Enums\StoryAudience;
use App\Models\AdminSetting;
use App\Models\Story;
use App\Models\User;
use App\Services\Payments\EntitlementService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class StoryService
{
    public function __construct(
        private EntitlementService $entitlementService,
        private StoryMediaService $storyMediaService,
    ) {}

    /**
     * Check if stories feature is enabled.
     */
    public function isEnabled(): bool
    {
        return (bool) AdminSetting::get('feature_stories_enabled', true);
    }

    /**
     * Get stories for dashboard - returns users with active stories the viewer can see.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getStoriesForDashboard(?User $viewer): array
    {
        if (! $this->isEnabled()) {
            return [];
        }

        if ($viewer === null) {
            // For non-authenticated users, only show public stories
            $usersWithStories = User::query()
                ->whereHas('stories', function ($query): void {
                    $query->active()
                        ->where('audience', StoryAudience::Public->value);
                })
                ->with(['stories' => function ($query): void {
                    $query->active()
                        ->where('audience', StoryAudience::Public->value)
                        ->with('media')
                        ->orderBy('position')
                        ->orderBy('created_at');
                }])
                ->get();

            return $this->formatStoriesForDashboard($usersWithStories, null);
        }

        // Get blocked user IDs (bidirectional)
        $blockedUserIds = $this->getBlockedUserIds($viewer);

        // Get users the viewer is following (with approved follow status)
        $followingUserIds = $viewer->approvedFollowings()
            ->pluck('followable_id')
            ->filter()
            ->map(static fn ($id) => (int) $id)
            ->values()
            ->toArray();

        // Include the viewer's own stories
        $followingUserIds[] = $viewer->getKey();

        // Get users with active stories, only from users the viewer follows, excluding blocked users
        $usersWithStories = User::query()
            ->whereIn('users.id', $followingUserIds)
            ->whereNotIn('users.id', $blockedUserIds)
            ->whereHas('stories', function ($query) use ($viewer): void {
                $query->active()
                    ->forViewer($viewer);
            })
            ->with(['stories' => function ($query) use ($viewer): void {
                $query->active()
                    ->forViewer($viewer)
                    ->with('media')
                    ->orderBy('position')
                    ->orderBy('created_at');
            }])
            ->get();

        return $this->formatStoriesForDashboard($usersWithStories, $viewer);
    }

    /**
     * Format users with stories for dashboard display.
     *
     * @param  Collection<int, User>  $users
     * @return array<int, array<string, mixed>>
     */
    private function formatStoriesForDashboard(Collection $users, ?User $viewer): array
    {
        return $users->map(function (User $user) use ($viewer): array {
            $activeStories = $user->stories->filter(fn (Story $story) => $story->published_at !== null && ! $story->isExpired());

            if ($activeStories->isEmpty()) {
                return null;
            }

            // Sort stories by position and created_at (oldest first, like Instagram)
            $sortedStories = $activeStories->sortBy([
                ['position', 'asc'],
                ['created_at', 'asc'],
            ]);

            $oldestStory = $sortedStories->first();
            $latestStory = $sortedStories->last();
            $storyCount = $activeStories->count();

            // Check if viewer has viewed all stories
            $hasNewStories = true;
            if ($viewer !== null) {
                $viewedStoryIds = $viewer->storyViews()
                    ->whereIn('story_id', $activeStories->pluck('id'))
                    ->pluck('story_id')
                    ->toArray();

                $hasNewStories = $activeStories->some(fn (Story $story) => ! in_array($story->id, $viewedStoryIds));
            }

            // Get preview URL from latest story (for the thumbnail)
            $previewUrl = $this->getStoryPreview($latestStory, $viewer)['url'] ?? null;

            return [
                'id' => $user->getKey(),
                'username' => $user->username,
                'display_name' => $user->display_name ?? $user->username,
                'avatar_url' => $user->avatar_url,
                'latest_story_preview' => $previewUrl,
                'story_count' => $storyCount,
                'has_new_stories' => $hasNewStories,
                'first_story_id' => $oldestStory->getKey(), // Show oldest story first (Instagram style)
            ];
        })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Get blocked user IDs (bidirectional blocking).
     *
     * @return array<int>
     */
    private function getBlockedUserIds(User $viewer): array
    {
        // Users the viewer has blocked
        $blockedByViewer = $viewer->blockedUsers()->pluck('users.id')->toArray();

        // Users who have blocked the viewer
        $blockersOfViewer = $viewer->blockers()->pluck('users.id')->toArray();

        return array_unique(array_merge($blockedByViewer, $blockersOfViewer));
    }

    /**
     * Create a new story.
     *
     * @param  array<string, mixed>  $data
     */
    public function createStory(User $user, array $data): Story
    {
        if (! $this->isEnabled()) {
            throw new \RuntimeException('Stories feature is not enabled.');
        }

        // Check max stories per user
        $maxStories = (int) config('stories.max_stories_per_user', 20);
        $activeStoriesCount = $user->activeStories()->count();

        if ($activeStoriesCount >= $maxStories) {
            throw new \RuntimeException("Maximum of {$maxStories} active stories per user.");
        }

        return DB::transaction(function () use ($user, $data, $activeStoriesCount): Story {
            // Create story media first
            $mediaData = $data['media'][0] ?? null;
            if ($mediaData === null) {
                throw new \InvalidArgumentException('Media is required for story creation.');
            }

            // Create story
            $story = new Story([
                'user_id' => $user->getKey(),
                'position' => $data['position'] ?? $activeStoriesCount,
                'audience' => StoryAudience::from($data['audience']),
                'is_subscriber_only' => $data['is_subscriber_only'] ?? false,
                'scheduled_at' => isset($data['scheduled_at']) ? Carbon::parse($data['scheduled_at']) : null,
            ]);

            // Set published_at if not scheduled
            if ($story->scheduled_at === null) {
                $story->published_at = Carbon::now();
            } elseif ($story->scheduled_at <= Carbon::now()) {
                // If scheduled time is in the past, publish immediately
                $story->published_at = Carbon::now();
            }

            $story->save();

            // Create story media using service (promotes and processes)
            $this->storyMediaService->attachFromTemporary($story, $mediaData);

            return $story->fresh(['media', 'user']);
        });
    }

    /**
     * Check if a story can be viewed by the given user.
     */
    public function canViewStory(Story $story, ?User $viewer): bool
    {
        // Story must be published and not expired
        if ($story->published_at === null || $story->published_at->isFuture()) {
            return false;
        }

        if ($story->isExpired()) {
            return false;
        }

        // Author can always view their own story
        if ($viewer !== null && $story->user_id === $viewer->getKey()) {
            return true;
        }

        // Check blocking (bidirectional)
        if ($viewer !== null && $story->relationLoaded('user')) {
            if ($viewer->isBlocking($story->user) || $story->user->isBlocking($viewer)) {
                return false;
            }
        }

        // Check audience
        $audience = $story->audience instanceof StoryAudience
            ? $story->audience
            : StoryAudience::from($story->audience);

        if ($audience === StoryAudience::Public) {
            // For subscriber-only stories, check subscription
            if ($story->is_subscriber_only && $viewer !== null) {
                return $this->entitlementService->hasActiveSubscription($viewer, $story->user);
            }

            return true;
        }

        if ($viewer === null) {
            return false;
        }

        if ($audience === StoryAudience::Followers) {
            // Check if viewer follows the author
            return $story->user->approvedFollowers()->where('users.id', $viewer->getKey())->exists();
        }

        if ($audience === StoryAudience::Subscribers) {
            // Check if viewer is subscribed to the author
            return $this->entitlementService->hasActiveSubscription($viewer, $story->user);
        }

        return false;
    }

    /**
     * Get story preview data (with blurred image if subscriber-only and not subscribed).
     *
     * @return array<string, mixed>
     */
    public function getStoryPreview(Story $story, ?User $viewer): array
    {
        $media = $story->media;

        if ($media === null) {
            return [
                'url' => null,
                'thumbnail_url' => null,
                'blur_url' => null,
            ];
        }

        // If subscriber-only and viewer not subscribed, return blurred image
        if ($story->is_subscriber_only && $viewer !== null && ! $this->entitlementService->hasActiveSubscription($viewer, $story->user)) {
            return [
                'url' => $media->blur_url,
                'thumbnail_url' => $media->thumbnail_url,
                'blur_url' => $media->blur_url,
                'is_blurred' => true,
            ];
        }

        // Use optimized_url for images when available, fall back to original url
        $mediaUrl = $media->optimized_url ?? $media->url;

        return [
            'url' => $mediaUrl,
            'optimized_url' => $media->optimized_url,
            'thumbnail_url' => $media->thumbnail_url,
            'blur_url' => $media->blur_url,
            'is_blurred' => false,
        ];
    }

    /**
     * Delete a story (soft delete to preserve data for future features).
     */
    public function deleteStory(Story $story): void
    {
        // Soft delete the story (preserves reactions, views, and analytics)
        $story->delete();
    }

    /**
     * Mark a story as viewed by the given user.
     */
    public function markAsViewed(Story $story, User $viewer): void
    {
        // Check if already viewed
        if ($story->views()->where('user_id', $viewer->getKey())->exists()) {
            return;
        }

        $story->markAsViewedBy($viewer);
    }

    /**
     * Get all active stories for a user, filtered by viewer permissions.
     *
     * @return Collection<int, Story>
     */
    public function getUserStories(User $user, ?User $viewer): Collection
    {
        $query = $user->stories()
            ->active()
            ->with('media')
            ->orderBy('position')
            ->orderBy('created_at');

        if ($viewer !== null && $viewer->getKey() !== $user->getKey()) {
            // Filter by viewer permissions
            $query->forViewer($viewer);
        }

        return $query->get();
    }
}

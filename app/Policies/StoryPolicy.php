<?php

namespace App\Policies;

use App\Models\Story;
use App\Models\User;
use App\Services\Stories\StoryService;

class StoryPolicy
{
    public function __construct(
        private StoryService $storyService,
    ) {}

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(?User $user = null): bool
    {
        return $this->storyService->isEnabled();
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(?User $user, Story $story): bool
    {
        return $this->storyService->canViewStory($story, $user);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        if (! $this->storyService->isEnabled()) {
            return false;
        }

        return $user->profile_completed_at !== null;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Story $story): bool
    {
        // Story author can delete their own story
        if ($user->getKey() === $story->user_id) {
            return true;
        }

        // Admins with remove content permission can delete
        return $user->can('remove content');
    }

    /**
     * Determine whether the user can view analytics for the story.
     */
    public function viewAnalytics(?User $user, Story $story): bool
    {
        if ($user === null) {
            return false;
        }

        // Story author can view analytics
        if ($user->getKey() === $story->user_id) {
            return true;
        }

        // Admins with analytics permissions can view
        return $user->can('view analytics') || $user->can('view creator analytics');
    }

    /**
     * Determine whether the user can moderate the story.
     */
    public function moderate(User $user, Story $story): bool
    {
        return $user->hasRole(['Admin', 'Super Admin', 'Moderator']);
    }
}

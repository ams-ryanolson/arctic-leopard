<?php

namespace App\Policies;

use App\Enums\PostAudience;
use App\Models\Post;
use App\Models\User;
use App\Support\Audience\AudienceDecision;

class PostPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(?User $user = null): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(?User $user, Post $post): bool
    {
        return AudienceDecision::make($post, $user)->canView();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // return $user->profile_completed_at !== null
        //     && $user->can('create posts');
        return $user->profile_completed_at !== null;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Post $post): bool
    {
        if ($user->id === $post->user_id) {
            return true;
        }

        if ($user->can('remove content')) {
            return true;
        }

        return $user->can('update posts');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Post $post): bool
    {
        return $this->update($user, $post);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Post $post): bool
    {
        return $this->update($user, $post);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Post $post): bool
    {
        return $user->can('remove content');
    }

    /**
     * Determine whether the user can interact with the post (comment, like).
     */
    public function interact(?User $user, Post $post): bool
    {
        if ($user === null) {
            return false;
        }

        $decision = AudienceDecision::make($post, $user);

        return $decision->canView() && ! $decision->requiresPurchase();
    }

    /**
     * Determine whether the user can bookmark the post.
     */
    public function bookmark(?User $user, Post $post): bool
    {
        if ($user === null) {
            return false;
        }

        return AudienceDecision::make($post, $user)->canView();
    }

    /**
     * Determine whether the user can view the analytics for the post.
     */
    public function viewAnalytics(?User $user, Post $post): bool
    {
        if ($user === null) {
            return false;
        }

        if ($user->getKey() === $post->user_id) {
            return true;
        }

        if ($user->can('view analytics') || $user->can('view creator analytics')) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can purchase access to the post.
     */
    public function purchase(User $user, Post $post): bool
    {
        $decision = AudienceDecision::make($post, $user);

        if ($decision->viewerIsAuthor()) {
            return false;
        }

        return $decision->audience() === PostAudience::PayToView && $decision->requiresPurchase();
    }
}

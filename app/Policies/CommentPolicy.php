<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\User;
use App\Support\Audience\AudienceDecision;

class CommentPolicy
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
    public function view(?User $user, Comment $comment): bool
    {
        if ($user !== null && $comment->isHiddenFor($user)) {
            return false;
        }

        return AudienceDecision::make($comment->post, $user)->canView();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->profile_completed_at !== null;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Comment $comment): bool
    {
        return $user->id === $comment->user_id || $user->can('remove content');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Comment $comment): bool
    {
        if ($this->update($user, $comment)) {
            return true;
        }

        return $user->id === $comment->post?->user_id || $user->can('remove content');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Comment $comment): bool
    {
        return $this->update($user, $comment);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Comment $comment): bool
    {
        return $user->can('remove content');
    }

    /**
     * Determine whether the user can reply to the comment.
     */
    public function reply(User $user, Comment $comment): bool
    {
        if ($comment->depth >= 2 || $comment->trashed()) {
            return false;
        }

        if ($comment->isHiddenFor($user)) {
            return false;
        }

        $decision = AudienceDecision::make($comment->post, $user);

        return $decision->canView() && ! $decision->requiresPurchase();
    }

    /**
     * Determine whether the user can like the comment.
     */
    public function like(User $user, Comment $comment): bool
    {
        if ($comment->trashed()) {
            return false;
        }

        if ($comment->isHiddenFor($user)) {
            return false;
        }

        $decision = AudienceDecision::make($comment->post, $user);

        return $decision->canView() && ! $decision->requiresPurchase();
    }

    /**
     * Determine whether the user can pin the comment on its post.
     */
    public function pin(User $user, Comment $comment): bool
    {
        return $user->id === $comment->post?->user_id || $user->can('lock comments');
    }

    /**
     * Determine whether the user can moderate the comment.
     */
    public function moderate(User $user, Comment $comment): bool
    {
        return $user->hasRole(['Admin', 'Super Admin', 'Moderator']);
    }
}

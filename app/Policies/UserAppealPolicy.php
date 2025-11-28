<?php

namespace App\Policies;

use App\Models\User;
use App\Models\UserAppeal;

class UserAppealPolicy
{
    /**
     * Determine if the user can create an appeal.
     */
    public function create(User $user): bool
    {
        // User must be suspended or banned and can appeal
        return $user->canAppeal();
    }

    /**
     * Determine if the user can view an appeal.
     */
    public function view(User $user, UserAppeal $appeal): bool
    {
        // Users can view their own appeals
        if ($user->is($appeal->user)) {
            return true;
        }

        // Admins and moderators can view any appeal
        return $user->hasRole(['Admin', 'Super Admin', 'Moderator']);
    }

    /**
     * Determine if the user can review appeals.
     */
    public function review(User $user, UserAppeal $appeal): bool
    {
        // Only admins and moderators can review
        if (! $user->hasRole(['Admin', 'Super Admin', 'Moderator'])) {
            return false;
        }

        // Appeal must be pending
        return $appeal->isPending();
    }
}

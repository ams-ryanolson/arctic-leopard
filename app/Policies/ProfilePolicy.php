<?php

namespace App\Policies;

use App\Models\User;

class ProfilePolicy
{
    public function view(?User $viewer, User $profile): bool
    {
        if ($viewer === null) {
            return true;
        }

        if ($viewer->is($profile)) {
            return true;
        }

        if ($viewer->hasBlockRelationshipWith($profile)) {
            return false;
        }

        // TODO: Privacy - Apply region-based restrictions
        // TODO: Privacy - Enforce public vs authenticated visibility settings
        // TODO: Privacy - Handle private profiles requiring approval

        return true;
    }

    public function update(User $user, User $profile): bool
    {
        return $user->id === $profile->id;
    }

    public function block(User $actor, User $target): bool
    {
        if ($actor->is($target)) {
            return false;
        }

        return true;
    }

    public function unblock(User $actor, User $target): bool
    {
        if ($actor->is($target)) {
            return false;
        }

        if ($actor->relationLoaded('blockedUsers')) {
            return $actor->getRelation('blockedUsers')->contains(
                fn (User $blocked): bool => $blocked->is($target),
            );
        }

        return $actor->blockedUsers()
            ->whereKey($target->getKey())
            ->exists();
    }

    public function manageBlocklist(User $user): bool
    {
        return $user->profile_completed_at !== null;
    }
}




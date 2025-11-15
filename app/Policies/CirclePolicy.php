<?php

namespace App\Policies;

use App\Models\Circle;
use App\Models\User;

class CirclePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(?User $user): bool
    {
        if ($user === null) {
            return false;
        }

        return $user->hasRole(['Admin', 'Super Admin']) || $user->can('manage roles');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(?User $user, Circle $circle): bool
    {
        if ($circle->visibility === 'public') {
            return true;
        }

        if ($user === null) {
            return false;
        }

        if ($user->isCircleMember($circle)) {
            return true;
        }

        return $user->can('manage roles') || $user->can('manage permissions');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasRole(['Admin', 'Super Admin']) || $user->can('manage roles');
    }

    /**
     * Determine whether the user can join the model.
     */
    public function join(User $user, Circle $circle): bool
    {
        if ($user->isCircleMember($circle)) {
            return true;
        }

        if (in_array($circle->visibility, ['public', 'listed'], true)) {
            return true;
        }

        return $user->can('manage roles');
    }

    /**
     * Determine whether the user can leave the model.
     */
    public function leave(User $user, Circle $circle): bool
    {
        return $user->isCircleMember($circle);
    }

    /**
     * Determine whether the user can manage the circle configuration.
     */
    public function manage(User $user, Circle $circle): bool
    {
        if ($this->isModerator($circle, $user)) {
            return true;
        }

        return $user->can('manage roles') || $user->can('manage permissions');
    }

    protected function isModerator(Circle $circle, User $user): bool
    {
        if ($circle->relationLoaded('members')) {
            return $circle->members->contains(function ($member) use ($user) {
                return (int) $member->getKey() === (int) $user->getKey()
                    && $member->pivot->role === 'moderator';
            });
        }

        return $circle->members()
            ->where('user_id', $user->getKey())
            ->where('role', 'moderator')
            ->exists();
    }
}

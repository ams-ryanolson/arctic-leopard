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

    /**
     * Determine if the user can view any users (admin list).
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole(['Admin', 'Super Admin']);
    }

    /**
     * Determine if the user can manage users (admin operation).
     */
    public function manageUsers(User $user, ?User $model = null): bool
    {
        return $user->hasRole(['Admin', 'Super Admin']);
    }

    /**
     * Determine if the user can update user roles (admin operation).
     */
    public function updateRoles(User $user, User $model): bool
    {
        // Super Admin can update anyone's roles
        if ($user->hasRole('Super Admin')) {
            return true;
        }

        // Admin can update roles but not their own or other admins/super admins
        if ($user->hasRole('Admin')) {
            // Admins cannot modify their own roles
            if ($user->is($model)) {
                return false;
            }

            // Admins cannot modify other admins or super admins
            if ($model->hasRole(['Admin', 'Super Admin'])) {
                return false;
            }

            return $user->can('manage roles');
        }

        return false;
    }

    /**
     * Determine if the user can ban other users (admin operation).
     */
    public function ban(User $user, User $model): bool
    {
        // Super Admin can ban anyone except themselves
        if ($user->hasRole('Super Admin')) {
            return ! $user->is($model);
        }

        // Admin can ban users but not themselves, other admins, or super admins
        if ($user->hasRole('Admin')) {
            if ($user->is($model)) {
                return false;
            }

            if ($model->hasRole(['Admin', 'Super Admin'])) {
                return false;
            }

            return $user->can('ban users');
        }

        return false;
    }

    /**
     * Determine if the user can impersonate other users (admin operation).
     */
    public function impersonate(User $user, User $model): bool
    {
        // Super Admin can impersonate anyone except themselves
        if ($user->hasRole('Super Admin')) {
            return ! $user->is($model);
        }

        // Admin can impersonate users but not themselves, other admins, or super admins
        if ($user->hasRole('Admin')) {
            if ($user->is($model)) {
                return false;
            }

            if ($model->hasRole(['Admin', 'Super Admin'])) {
                return false;
            }

            return $user->can('impersonate users');
        }

        return false;
    }

    /**
     * Determine if the user can access the admin dashboard.
     */
    public function accessAdmin(User $user): bool
    {
        return $user->hasRole(['Admin', 'Super Admin']);
    }
}

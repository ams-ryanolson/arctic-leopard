<?php

namespace App\Services;

use App\Models\AdminSetting;
use App\Models\RoleFeatureOverride;
use App\Models\User;
use App\Models\UserFeatureOverride;

class FeatureFlagService
{
    /**
     * Check if a feature is enabled for a user.
     * Priority: User override > Role override > Global setting
     */
    public function isEnabled(?User $user, string $featureKey, bool $default = true): bool
    {
        // 1. Check user-specific override first (highest priority)
        if ($user) {
            $userOverride = UserFeatureOverride::query()
                ->where('user_id', $user->id)
                ->where('feature_key', $featureKey)
                ->first();

            if ($userOverride !== null) {
                return $userOverride->enabled;
            }

            // 2. Check role-based overrides
            // User model uses Spatie's HasRoles trait which provides getRoleNames()
            $roles = $user->getRoleNames()->all();

            if (! empty($roles)) {
                $roleOverride = RoleFeatureOverride::query()
                    ->whereIn('role_name', $roles)
                    ->where('feature_key', $featureKey)
                    ->first();

                if ($roleOverride !== null) {
                    return $roleOverride->enabled;
                }
            }
        }

        // 3. Fall back to global setting
        return (bool) AdminSetting::get($featureKey, $default);
    }

    /**
     * Set a user-specific override for a feature.
     */
    public function setUserOverride(User $user, string $featureKey, bool $enabled): void
    {
        UserFeatureOverride::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'feature_key' => $featureKey,
            ],
            [
                'enabled' => $enabled,
            ]
        );
    }

    /**
     * Remove a user-specific override for a feature.
     */
    public function removeUserOverride(User $user, string $featureKey): void
    {
        UserFeatureOverride::query()
            ->where('user_id', $user->id)
            ->where('feature_key', $featureKey)
            ->delete();
    }

    /**
     * Set a role-based override for a feature.
     */
    public function setRoleOverride(string $roleName, string $featureKey, bool $enabled): void
    {
        RoleFeatureOverride::query()->updateOrCreate(
            [
                'role_name' => $roleName,
                'feature_key' => $featureKey,
            ],
            [
                'enabled' => $enabled,
            ]
        );
    }

    /**
     * Remove a role-based override for a feature.
     */
    public function removeRoleOverride(string $roleName, string $featureKey): void
    {
        RoleFeatureOverride::query()
            ->where('role_name', $roleName)
            ->where('feature_key', $featureKey)
            ->delete();
    }

    /**
     * Get all user overrides for a feature.
     */
    public function getUserOverrides(string $featureKey): array
    {
        return UserFeatureOverride::query()
            ->with('user:id,name,email')
            ->where('feature_key', $featureKey)
            ->get()
            ->filter(fn ($override) => $override->user !== null) // Filter out deleted users
            ->map(fn ($override) => [
                'id' => $override->user_id,
                'name' => $override->user->name ?? $override->user->email,
                'email' => $override->user->email,
                'enabled' => $override->enabled,
            ])
            ->values()
            ->all();
    }

    /**
     * Get all role overrides for a feature.
     */
    public function getRoleOverrides(string $featureKey): array
    {
        return RoleFeatureOverride::query()
            ->where('feature_key', $featureKey)
            ->get()
            ->map(fn ($override) => [
                'role_name' => $override->role_name,
                'enabled' => $override->enabled,
            ])
            ->all();
    }
}

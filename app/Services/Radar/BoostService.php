<?php

namespace App\Services\Radar;

use App\Models\RadarBoost;
use App\Models\User;
use Illuminate\Support\Carbon;

class BoostService
{
    private const BOOST_DURATION_HOURS = 1;

    /**
     * Get the daily boost limit based on user roles.
     * - Free users (User role only): 1 per day
     * - Paid members (Premium role): 2 per day
     * - Anyone else (Creator, Moderator, Admin, Super Admin, or multiple roles): 3 per day
     */
    public function getDailyBoostLimit(User $user): int
    {
        $roles = $user->getRoleNames()->toArray();

        // Check if user has only the 'User' role (free user)
        if (count($roles) === 1 && in_array('User', $roles, true)) {
            return 1;
        }

        // Check if user has 'Premium' role (paid member)
        if (in_array('Premium', $roles, true)) {
            return 2;
        }

        // Anyone else (Creator, Moderator, Admin, Super Admin, or multiple roles) gets 3
        return 3;
    }

    /**
     * Get the number of boosts used today by the user.
     */
    public function getBoostsUsedToday(User $user): int
    {
        return RadarBoost::query()
            ->forUser($user)
            ->today()
            ->count();
    }

    /**
     * Check if the user can activate a boost.
     */
    public function canBoost(User $user): bool
    {
        // Check if user already has an active boost
        if ($this->isCurrentlyBoosting($user)) {
            return false;
        }

        // Check daily limit
        $boostsUsedToday = $this->getBoostsUsedToday($user);
        $dailyLimit = $this->getDailyBoostLimit($user);

        return $boostsUsedToday < $dailyLimit;
    }

    /**
     * Check if the user is currently boosting.
     */
    public function isCurrentlyBoosting(User $user): bool
    {
        return RadarBoost::query()
            ->forUser($user)
            ->active()
            ->exists();
    }

    /**
     * Get the active boost for the user, if any.
     */
    public function getActiveBoost(User $user): ?RadarBoost
    {
        return RadarBoost::query()
            ->forUser($user)
            ->active()
            ->latest('expires_at')
            ->first();
    }

    /**
     * Activate a boost for the user.
     */
    public function activateBoost(User $user): RadarBoost
    {
        if (! $this->canBoost($user)) {
            throw new \RuntimeException('User cannot activate a boost at this time.');
        }

        return RadarBoost::create([
            'user_id' => $user->getKey(),
            'expires_at' => Carbon::now()->addHours(self::BOOST_DURATION_HOURS),
        ]);
    }

    /**
     * Get boost information for the viewer (limits, usage, active status).
     */
    public function getBoostInfo(User $user): array
    {
        $activeBoost = $this->getActiveBoost($user);
        $boostsUsedToday = $this->getBoostsUsedToday($user);
        $dailyLimit = $this->getDailyBoostLimit($user);

        return [
            'is_boosting' => $activeBoost !== null,
            'expires_at' => $activeBoost?->expires_at?->toIso8601String(),
            'boosts_used_today' => $boostsUsedToday,
            'daily_limit' => $dailyLimit,
            'can_boost' => $this->canBoost($user),
        ];
    }

    /**
     * Get active boosts for multiple users by their IDs.
     * Returns an array keyed by user_id => true for users with active boosts.
     *
     * @param  array<int>  $userIds
     * @return array<int, bool>
     */
    public function getActiveBoostsByUserIds(array $userIds): array
    {
        if (empty($userIds)) {
            return [];
        }

        $activeBoosts = RadarBoost::query()
            ->whereIn('user_id', $userIds)
            ->active()
            ->pluck('user_id')
            ->unique()
            ->all();

        return array_fill_keys($activeBoosts, true);
    }
}

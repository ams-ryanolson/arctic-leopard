<?php

namespace App\Policies;

use App\Enums\Ads\AdStatus;
use App\Models\Ads\Ad;
use App\Models\User;

class AdPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('manage ads');
    }

    public function view(User $user, Ad $ad): bool
    {
        if ($user->can('manage ads')) {
            return true;
        }

        // Advertisers can view their own ads
        return (int) $ad->advertiser_id === (int) $user->getKey();
    }

    public function create(User $user): bool
    {
        // Authenticated users can create ads (for self-serve) or admins
        return $user->can('manage ads') || $user !== null;
    }

    public function update(User $user, Ad $ad): bool
    {
        if ($user->can('manage ads')) {
            return true;
        }

        // Advertisers can update their own ads if in draft or pending_review status
        if ((int) $ad->advertiser_id === (int) $user->getKey()) {
            return in_array($ad->status, [AdStatus::Draft, AdStatus::PendingReview], true);
        }

        return false;
    }

    public function delete(User $user, Ad $ad): bool
    {
        if ($user->can('manage ads')) {
            return true;
        }

        // Advertisers can delete their own ads if not active
        if ((int) $ad->advertiser_id === (int) $user->getKey()) {
            return $ad->status !== AdStatus::Active;
        }

        return false;
    }

    public function approve(User $user, Ad $ad): bool
    {
        return $user->can('manage ads');
    }

    public function reject(User $user, Ad $ad): bool
    {
        return $user->can('manage ads');
    }

    public function pause(User $user, Ad $ad): bool
    {
        if ($user->can('manage ads')) {
            return true;
        }

        // Advertisers can pause their own ads
        return (int) $ad->advertiser_id === (int) $user->getKey();
    }

    public function resume(User $user, Ad $ad): bool
    {
        if ($user->can('manage ads')) {
            return true;
        }

        // Advertisers can resume their own paused ads
        if ((int) $ad->advertiser_id === (int) $user->getKey()) {
            return $ad->status === AdStatus::Paused;
        }

        return false;
    }
}

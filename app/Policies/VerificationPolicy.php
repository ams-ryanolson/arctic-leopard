<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Verification;

class VerificationPolicy
{
    /**
     * Determine whether the user can view their own verification.
     */
    public function view(User $user, Verification $verification): bool
    {
        return (int) $verification->user_id === (int) $user->getKey();
    }

    /**
     * Determine whether the user can create a verification.
     */
    public function create(User $user): bool
    {
        return true;
    }
}

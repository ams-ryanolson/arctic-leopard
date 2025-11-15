<?php

namespace App\Policies;

use App\Models\Memberships\UserMembership;
use App\Models\User;

class UserMembershipPolicy
{
    public function update(User $user, UserMembership $membership): bool
    {
        return $user->id === $membership->user_id;
    }

    public function cancel(User $user, UserMembership $membership): bool
    {
        return $user->id === $membership->user_id;
    }
}

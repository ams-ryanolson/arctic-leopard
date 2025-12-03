<?php

namespace App\Events\Memberships;

use App\Models\Memberships\UserMembership;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MembershipGifted
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public UserMembership $membership,
        public User $gifter
    ) {}
}

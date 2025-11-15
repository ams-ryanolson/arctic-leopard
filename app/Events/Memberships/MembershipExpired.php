<?php

namespace App\Events\Memberships;

use App\Models\Memberships\UserMembership;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MembershipExpired
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public UserMembership $membership) {}
}

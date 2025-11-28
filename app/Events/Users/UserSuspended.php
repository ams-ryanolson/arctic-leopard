<?php

namespace App\Events\Users;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class UserSuspended
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public User $user,
        public ?Carbon $until = null,
        public ?string $reason = null,
        public ?User $admin = null,
    ) {}
}

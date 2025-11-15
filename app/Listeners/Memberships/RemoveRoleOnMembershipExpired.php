<?php

namespace App\Listeners\Memberships;

use App\Events\Memberships\MembershipExpired;
use App\Services\Memberships\MembershipService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class RemoveRoleOnMembershipExpired implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        private readonly MembershipService $membershipService
    ) {}

    public function handle(MembershipExpired $event): void
    {
        $this->membershipService->removeRole($event->membership);
    }
}

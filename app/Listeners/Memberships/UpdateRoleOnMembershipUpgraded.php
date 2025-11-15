<?php

namespace App\Listeners\Memberships;

use App\Events\Memberships\MembershipUpgraded;
use App\Services\Memberships\MembershipService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class UpdateRoleOnMembershipUpgraded implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        private readonly MembershipService $membershipService
    ) {}

    public function handle(MembershipUpgraded $event): void
    {
        // Remove old role
        $this->membershipService->removeRole($event->oldMembership);

        // Assign new role
        $this->membershipService->assignRole($event->newMembership);
    }
}

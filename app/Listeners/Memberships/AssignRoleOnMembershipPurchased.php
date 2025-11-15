<?php

namespace App\Listeners\Memberships;

use App\Events\Memberships\MembershipPurchased;
use App\Services\Memberships\MembershipService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class AssignRoleOnMembershipPurchased implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        private readonly MembershipService $membershipService
    ) {}

    public function handle(MembershipPurchased $event): void
    {
        $this->membershipService->assignRole($event->membership);
    }
}

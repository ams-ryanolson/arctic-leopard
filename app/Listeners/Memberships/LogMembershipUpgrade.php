<?php

namespace App\Listeners\Memberships;

use App\Enums\ActivityType;
use App\Events\Memberships\MembershipUpgraded;
use App\Services\ActivityLogService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Http\Request;
use Illuminate\Queue\InteractsWithQueue;

class LogMembershipUpgrade implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly Request $request
    ) {}

    public function handle(MembershipUpgraded $event): void
    {
        $oldMembership = $event->oldMembership->loadMissing('plan');
        $newMembership = $event->newMembership->loadMissing('plan');
        $user = $newMembership->user;

        $this->activityLog->log(
            ActivityType::MembershipUpgraded,
            "User upgraded from {$oldMembership->plan->name} to {$newMembership->plan->name}",
            $user,
            $user,
            [
                'old_plan_id' => $oldMembership->membership_plan_id,
                'old_plan_name' => $oldMembership->plan->name,
                'new_plan_id' => $newMembership->membership_plan_id,
                'new_plan_name' => $newMembership->plan->name,
                'amount' => $newMembership->original_price,
                'currency' => $newMembership->plan->currency ?? 'USD',
            ],
            $this->request
        );
    }
}

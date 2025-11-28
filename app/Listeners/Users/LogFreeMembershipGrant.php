<?php

namespace App\Listeners\Users;

use App\Enums\ActivityType;
use App\Events\Users\FreeMembershipGranted;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class LogFreeMembershipGrant
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly Request $request
    ) {}

    public function handle(FreeMembershipGranted $event): void
    {
        $this->activityLog->log(
            ActivityType::FreeMembershipGranted,
            "Free membership granted to user {$event->user->username}",
            $event->user,
            $event->admin,
            [
                'membership_id' => $event->membership->getKey(),
                'plan_id' => $event->membership->membership_plan_id,
                'ends_at' => $event->membership->ends_at?->toIso8601String(),
            ],
            $this->request
        );
    }
}

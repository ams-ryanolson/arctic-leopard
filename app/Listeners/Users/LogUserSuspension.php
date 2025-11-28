<?php

namespace App\Listeners\Users;

use App\Enums\ActivityType;
use App\Events\Users\UserSuspended;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class LogUserSuspension
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly Request $request
    ) {}

    public function handle(UserSuspended $event): void
    {
        $until = $event->until ? " until {$event->until->toDateString()}" : '';

        $this->activityLog->log(
            ActivityType::UserSuspended,
            "User {$event->user->username} suspended{$until}",
            $event->user,
            $event->admin,
            [
                'reason' => $event->reason,
                'suspended_until' => $event->until?->toIso8601String(),
            ],
            $this->request
        );
    }
}

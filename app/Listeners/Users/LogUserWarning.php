<?php

namespace App\Listeners\Users;

use App\Enums\ActivityType;
use App\Events\Users\UserWarned;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class LogUserWarning
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly Request $request
    ) {}

    public function handle(UserWarned $event): void
    {
        $this->activityLog->log(
            ActivityType::UserWarned,
            "User {$event->user->username} warned",
            $event->user,
            $event->admin,
            [
                'warning_id' => $event->warning->getKey(),
                'reason' => $event->warning->reason,
                'expires_at' => $event->warning->expires_at?->toIso8601String(),
            ],
            $this->request
        );
    }
}

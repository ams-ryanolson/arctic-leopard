<?php

namespace App\Listeners\Users;

use App\Enums\ActivityType;
use App\Events\Users\UserBanned;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class LogUserBan
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly Request $request
    ) {}

    public function handle(UserBanned $event): void
    {
        $this->activityLog->log(
            ActivityType::UserBanned,
            "User {$event->user->username} banned",
            $event->user,
            $event->admin,
            [
                'reason' => $event->reason,
            ],
            $this->request
        );
    }
}

<?php

namespace App\Listeners;

use App\Enums\ActivityType;
use App\Services\ActivityLogService;
use Illuminate\Auth\Events\Logout;
use Illuminate\Http\Request;

class LogUserLogout
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly Request $request
    ) {}

    public function handle(Logout $event): void
    {
        if ($event->user) {
            $this->activityLog->log(
                ActivityType::UserLogout,
                "User {$event->user->name} logged out",
                $event->user,
                $event->user,
                [],
                $this->request
            );
        }
    }
}

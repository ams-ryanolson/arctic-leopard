<?php

namespace App\Listeners;

use App\Enums\ActivityType;
use App\Services\ActivityLogService;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\Request;

class LogUserLogin
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly Request $request
    ) {}

    public function handle(Login $event): void
    {
        $this->activityLog->log(
            ActivityType::UserLogin,
            "User {$event->user->name} logged in",
            $event->user,
            $event->user,
            [],
            $this->request
        );
    }
}

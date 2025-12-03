<?php

namespace App\Listeners;

use App\Enums\ActivityType;
use App\Services\ActivityLogService;
use Illuminate\Auth\Events\Failed;
use Illuminate\Http\Request;

class LogFailedLogin
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly Request $request
    ) {}

    public function handle(Failed $event): void
    {
        $email = $event->credentials['email'] ?? 'unknown';

        $this->activityLog->log(
            ActivityType::UserLoginFailed,
            "Failed login attempt for email: {$email}",
            $event->user, // This will be null for failed logins, but we log it anyway
            null,
            [
                'email' => $email,
                'guard' => $event->guard,
            ],
            $this->request
        );
    }
}

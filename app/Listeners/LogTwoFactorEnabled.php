<?php

namespace App\Listeners;

use App\Enums\ActivityType;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Laravel\Fortify\Events\TwoFactorAuthenticationEnabled;

class LogTwoFactorEnabled
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly Request $request
    ) {}

    public function handle(TwoFactorAuthenticationEnabled $event): void
    {
        $this->activityLog->log(
            ActivityType::TwoFactorEnabled,
            "User {$event->user->name} enabled two-factor authentication",
            $event->user,
            $event->user,
            [],
            $this->request
        );
    }
}

<?php

namespace App\Listeners;

use App\Enums\ActivityType;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Laravel\Fortify\Events\TwoFactorAuthenticationDisabled;

class LogTwoFactorDisabled
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly Request $request
    ) {}

    public function handle(TwoFactorAuthenticationDisabled $event): void
    {
        $this->activityLog->log(
            ActivityType::TwoFactorDisabled,
            "User {$event->user->name} disabled two-factor authentication",
            $event->user,
            $event->user,
            [],
            $this->request
        );
    }
}

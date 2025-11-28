<?php

namespace App\Listeners\Users;

use App\Enums\ActivityType;
use App\Events\Users\AppealSubmitted;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class LogAppealSubmitted
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly Request $request
    ) {}

    public function handle(AppealSubmitted $event): void
    {
        $this->activityLog->log(
            ActivityType::AppealSubmitted,
            "User {$event->appeal->user->username} submitted {$event->appeal->appeal_type->value} appeal",
            $event->appeal->user,
            $event->appeal->user,
            [
                'appeal_id' => $event->appeal->getKey(),
                'appeal_type' => $event->appeal->appeal_type->value,
            ],
            $this->request
        );
    }
}

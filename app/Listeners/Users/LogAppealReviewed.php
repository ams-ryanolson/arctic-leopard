<?php

namespace App\Listeners\Users;

use App\Enums\ActivityType;
use App\Enums\AppealStatus;
use App\Events\Users\AppealReviewed;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class LogAppealReviewed
{
    public function __construct(
        private readonly ActivityLogService $activityLog,
        private readonly Request $request
    ) {}

    public function handle(AppealReviewed $event): void
    {
        $activityType = match ($event->status) {
            AppealStatus::Approved => ActivityType::AppealApproved,
            AppealStatus::Rejected => ActivityType::AppealRejected,
            default => null,
        };

        if ($activityType === null) {
            return;
        }

        $this->activityLog->log(
            $activityType,
            "Appeal {$event->status->value} for user {$event->appeal->user->username}",
            $event->appeal->user,
            $event->reviewer,
            [
                'appeal_id' => $event->appeal->getKey(),
                'appeal_type' => $event->appeal->appeal_type->value,
                'review_notes' => $event->appeal->review_notes,
            ],
            $this->request
        );
    }
}

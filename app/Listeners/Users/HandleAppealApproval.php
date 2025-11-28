<?php

namespace App\Listeners\Users;

use App\Enums\AppealStatus;
use App\Events\Users\AppealReviewed;

class HandleAppealApproval
{
    public function handle(AppealReviewed $event): void
    {
        if ($event->status !== AppealStatus::Approved) {
            return;
        }

        $user = $event->appeal->user->fresh();

        // Auto-unsuspend or unban based on appeal type
        if ($event->appeal->appeal_type === \App\Enums\AppealType::Suspension) {
            $user->unsuspend();
            \App\Events\Users\UserUnsuspended::dispatch($user, $event->reviewer);
        } elseif ($event->appeal->appeal_type === \App\Enums\AppealType::Ban) {
            $user->unban();
            \App\Events\Users\UserUnbanned::dispatch($user, $event->reviewer);
        }
    }
}

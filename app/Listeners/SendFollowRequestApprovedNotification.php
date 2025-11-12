<?php

namespace App\Listeners;

use App\Events\UserFollowAccepted;
use App\Models\User;
use App\Notifications\UserFollowRequestApprovedNotification;
use App\Services\Toasts\ToastBus;

class SendFollowRequestApprovedNotification
{
    private static array $handledEventIds = [];

    public function __construct(
        private readonly ToastBus $toastBus,
    ) {
    }

    /**
     * Handle the event.
     */
    public function handle(UserFollowAccepted $event): void
    {
        if (! $event->wasPendingRequest) {
            return;
        }

        $follower = $event->follower;
        $followed = $event->followed;

        if ($follower->hasBlockRelationshipWith($followed)) {
            return;
        }

        $eventId = spl_object_id($event);

        if (isset(self::$handledEventIds[$eventId])) {
            return;
        }

        $alreadyNotified = $follower->notifications()
            ->where('type', UserFollowRequestApprovedNotification::TYPE)
            ->whereJsonContains('data->actor->id', $followed->getKey())
            ->exists();

        if ($alreadyNotified) {
            return;
        }

        self::$handledEventIds[$eventId] = true;

        $follower->notify(new UserFollowRequestApprovedNotification($followed));

        $toastId = sprintf('follow-request-approved:%s:%s', $follower->getKey(), $followed->getKey());

        $this->toastBus->success($follower, sprintf('%s approved your follow request.', $this->actorLabel($followed)), [
            'id' => $toastId,
            'title' => 'Request approved',
            'actions' => [
                [
                    'key' => 'view-profile',
                    'label' => 'View profile',
                    'method' => 'router.visit',
                    'route' => route('profile.show', [
                        'username' => $followed->username ?? $followed->getKey(),
                    ]),
                ],
            ],
            'meta' => [
                'notification_type' => UserFollowRequestApprovedNotification::TYPE,
                'followed_id' => $followed->getKey(),
            ],
        ]);
    }

    private function actorLabel(User $user): string
    {
        if ($user->display_name) {
            return $user->display_name;
        }

        if ($user->username) {
            return '@'.$user->username;
        }

        return $user->name ?? 'Someone';
    }
}



<?php

namespace App\Listeners;

use App\Events\UserFollowAccepted;
use App\Models\User;
use App\Notifications\UserFollowedNotification;
use App\Notifications\UserFollowRequestedNotification;
use App\Services\Toasts\ToastBus;
use Illuminate\Support\Facades\Cache;

class SendUserFollowedNotification
{
    private static array $handledEventIds = [];

    public function __construct(
        private readonly ToastBus $toastBus,
    ) {}

    public function handle(UserFollowAccepted $event): void
    {
        $followed = $event->followed;
        $follower = $event->follower;

        if ($follower->is($followed)) {
            return;
        }

        if ($follower->hasBlockRelationshipWith($followed)) {
            return;
        }

        $eventId = spl_object_id($event);

        if (isset(self::$handledEventIds[$eventId])) {
            return;
        }

        self::$handledEventIds[$eventId] = true;

        // Cache lock to prevent duplicate notifications (race condition with queued notifications)
        $lockKey = sprintf('follow-notification:%d:%d', $followed->getKey(), $follower->getKey());
        if (! Cache::add($lockKey, true, 60)) {
            return; // Another notification is already being processed
        }

        $existingRequests = $followed->notifications()
            ->where('type', UserFollowRequestedNotification::TYPE)
            ->get()
            ->filter(
                fn ($notification): bool => (int) data_get($notification->data, 'actor.id') === $follower->getKey()
            );

        if ($existingRequests->isNotEmpty()) {
            $replacement = new UserFollowedNotification($follower);
            $payload = $replacement->toDatabase($followed);

            $existingRequests->each(function ($notification) use ($payload): void {
                $notification->forceFill([
                    'type' => UserFollowedNotification::TYPE,
                    'data' => $payload,
                    'read_at' => null,
                    'updated_at' => now(),
                ])->save();
            });

            $this->sendToast($followed, $follower);

            return;
        }

        $alreadyNotified = $followed->notifications()
            ->where('type', UserFollowedNotification::TYPE)
            ->whereJsonContains('data->actor->id', $follower->getKey())
            ->exists();

        if ($alreadyNotified) {
            return;
        }

        $followed->notify(new UserFollowedNotification($follower));

        $this->sendToast($followed, $follower);
    }

    private function sendToast(User $followed, User $follower): void
    {
        $toastId = sprintf('new-follower:%s:%s', $followed->getKey(), $follower->getKey());

        $this->toastBus->success($followed, sprintf('%s is now following you.', $this->actorLabel($follower)), [
            'id' => $toastId,
            'title' => 'New follower',
            'actions' => [
                [
                    'key' => 'view-profile',
                    'label' => 'View profile',
                    'method' => 'router.visit',
                    'route' => route('profile.show', [
                        'username' => $follower->username ?? $follower->getKey(),
                    ]),
                ],
            ],
            'meta' => [
                'notification_type' => UserFollowedNotification::TYPE,
                'follower_id' => $follower->getKey(),
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

<?php

namespace App\Listeners;

use App\Events\UserFollowRequested;
use App\Models\User;
use App\Notifications\UserFollowRequestedNotification;
use App\Services\Toasts\ToastBus;
use Illuminate\Support\Facades\Cache;

class SendUserFollowRequestedNotification
{
    private static array $handledEventIds = [];

    public function __construct(
        private readonly ToastBus $toastBus,
    ) {}

    /**
     * Handle the event.
     */
    public function handle(UserFollowRequested $event): void
    {
        $followed = $event->followed;
        $follower = $event->follower;

        if ($follower->is($followed)) {
            return;
        }

        if ($follower->hasBlockRelationshipWith($followed)) {
            return;
        }

        if (! $followed->needsToApproveFollowRequests()) {
            return;
        }

        $eventId = spl_object_id($event);

        if (isset(self::$handledEventIds[$eventId])) {
            return;
        }

        $cacheKey = sprintf('follow-request:%s:%s', $followed->getKey(), $follower->getKey());

        if (Cache::get($cacheKey)) {
            return;
        }

        self::$handledEventIds[$eventId] = true;

        $alreadyNotified = $followed->notifications()
            ->where('type', UserFollowRequestedNotification::TYPE)
            ->whereJsonContains('data->actor->id', $follower->getKey())
            ->exists();

        if ($alreadyNotified) {
            Cache::put($cacheKey, true, now()->addMinutes(5));

            return;
        }

        $followed->notify(new UserFollowRequestedNotification($follower));
        Cache::put($cacheKey, true, now()->addMinutes(5));

        $toastId = sprintf('follow-request:%s:%s', $followed->getKey(), $follower->getKey());

        $this->toastBus->info($followed, sprintf('%s requested to follow you.', $this->actorLabel($follower)), [
            'id' => $toastId,
            'title' => 'Follow request',
            'actions' => [
                [
                    'key' => 'review-follow-requests',
                    'label' => 'Review requests',
                    'method' => 'router.visit',
                    'route' => route('notifications.index', ['filter' => 'unread']),
                ],
            ],
            'meta' => [
                'notification_type' => UserFollowRequestedNotification::TYPE,
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

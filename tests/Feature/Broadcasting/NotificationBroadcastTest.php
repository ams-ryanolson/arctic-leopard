<?php

use App\Models\User;
use App\Notifications\UserFollowedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\Events\BroadcastNotificationCreated;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

it('broadcasts notifications with unread counts and metadata', function (): void {
    $recipient = User::factory()->create();
    $actor = User::factory()->create();

    $notification = new UserFollowedNotification($actor);

    expect($notification->via($recipient))->toContain('broadcast');

    Event::fake([BroadcastNotificationCreated::class]);

    $recipient->notify($notification);

    Event::assertDispatched(
        BroadcastNotificationCreated::class,
        function (BroadcastNotificationCreated $event) use ($recipient, $actor): bool {
            expect($event->notifiable->is($recipient))->toBeTrue();

            $channels = collect($event->broadcastOn())->map(fn ($channel) => $channel->name);

            expect($channels)->toContain(sprintf('private-users.%d.notifications', $recipient->getKey()));

            $payload = $event->broadcastWith();
            $recipient->refresh();

            expect($payload['unread_count'] ?? null)->toBe($recipient->unreadNotifications()->count());
            expect($payload['notification']['type'] ?? null)->toBe(UserFollowedNotification::TYPE);
            expect($payload['notification']['actor']['id'] ?? null)->toBe($actor->getKey());

            return true;
        }
    );
});

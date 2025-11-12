<?php

namespace App\Listeners;

use App\Events\UserBlocked;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Queue\InteractsWithQueue;

class PurgeNotificationsForBlockedUsers implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public function handle(UserBlocked $event): void
    {
        $block = $event->block;
        $participantIds = [$block->blocker_id, $block->blocked_id];

        DatabaseNotification::query()
            ->where('notifiable_type', User::class)
            ->whereIn('notifiable_id', $participantIds)
            ->where(function ($query) use ($participantIds): void {
                foreach ($participantIds as $participantId) {
                    $query->orWhereJsonContains('data->actor->id', $participantId)
                        ->orWhereJsonContains('data->subject->id', $participantId);
                }
            })
            ->delete();
    }
}





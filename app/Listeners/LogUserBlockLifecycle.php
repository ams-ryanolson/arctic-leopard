<?php

namespace App\Listeners;

use App\Events\UserBlocked;
use App\Events\UserUnblocked;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use function activity;

class LogUserBlockLifecycle implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'events';

    public function handle(UserBlocked|UserUnblocked $event): void
    {
        $block = $event->block->loadMissing(['blocker', 'blocked']);

        activity('user-blocks')
            ->performedOn($block)
            ->causedBy($block->blocker)
            ->withProperties([
                'blocker_id' => $block->blocker_id,
                'blocked_id' => $block->blocked_id,
                'was_unblocked' => $event instanceof UserUnblocked,
            ])
            ->log($event instanceof UserUnblocked ? 'user_unblocked' : 'user_blocked');
    }
}



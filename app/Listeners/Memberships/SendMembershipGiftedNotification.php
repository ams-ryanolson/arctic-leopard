<?php

namespace App\Listeners\Memberships;

use App\Events\Memberships\MembershipGifted;
use App\Notifications\Memberships\MembershipGiftedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendMembershipGiftedNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(MembershipGifted $event): void
    {
        $recipient = $event->membership->user;
        $gifter = $event->gifter;

        $recipient->notify(new MembershipGiftedNotification($gifter, $event->membership));
    }
}

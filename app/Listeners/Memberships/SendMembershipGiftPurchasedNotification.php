<?php

namespace App\Listeners\Memberships;

use App\Events\Memberships\MembershipGifted;
use App\Notifications\Memberships\MembershipGiftPurchasedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendMembershipGiftPurchasedNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(MembershipGifted $event): void
    {
        $gifter = $event->gifter;
        $recipient = $event->membership->user;

        $gifter->notify(new MembershipGiftPurchasedNotification($gifter, $event->membership, $recipient));
    }
}

<?php

namespace App\Listeners\Memberships;

use App\Events\Memberships\MembershipRenewed;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class ProcessRecurringRenewal implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(MembershipRenewed $event): void
    {
        // This listener can be extended to handle additional renewal logic
        // such as sending notifications, updating analytics, etc.
    }
}

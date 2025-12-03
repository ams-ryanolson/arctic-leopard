<?php

namespace App\Notifications\Memberships;

use App\Models\Memberships\UserMembership;
use App\Models\User;
use App\Notifications\DatabaseNotification;

class MembershipGiftPurchasedNotification extends DatabaseNotification
{
    public const TYPE = 'membership-gift-purchased';

    public function __construct(
        User $gifter,
        public UserMembership $membership,
        public User $recipient
    ) {
        parent::__construct($gifter);
    }

    public function databaseType(object $notifiable): string
    {
        return self::TYPE;
    }

    protected function subjectPayload(object $notifiable): array
    {
        return [
            'type' => 'membership',
            'id' => (string) $this->membership->id,
            'membership_id' => $this->membership->id,
            'plan_name' => $this->membership->plan->name,
            'recipient_id' => $this->recipient->id,
            'recipient_username' => $this->recipient->username,
            'recipient_display_name' => $this->recipient->display_name,
        ];
    }

    protected function metaPayload(object $notifiable): array
    {
        return [
            'plan_id' => $this->membership->plan->id,
            'plan_slug' => $this->membership->plan->slug,
        ];
    }
}

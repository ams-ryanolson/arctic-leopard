<?php

namespace App\Notifications;

use App\Models\User;

class UserFollowedNotification extends DatabaseNotification
{
    public const TYPE = 'user-followed';

    public function __construct(User $actor)
    {
        parent::__construct($actor);
    }

    #[\Override]
    public function databaseType(object $notifiable): string
    {
        return self::TYPE;
    }

    #[\Override]
    protected function subjectPayload(object $notifiable): array
    {
        return [
            'type' => 'user',
            'id' => $this->actor->username,
        ];
    }
}


<?php

namespace App\Notifications;

use App\Models\Post;
use App\Models\User;
use App\Notifications\Concerns\InteractsWithPost;

class PostBookmarkedNotification extends DatabaseNotification
{
    use InteractsWithPost;

    public function __construct(User $actor, protected Post $post)
    {
        parent::__construct($actor);
    }

    #[\Override]
    public function databaseType(object $notifiable): string
    {
        return 'post-bookmarked';
    }

    #[\Override]
    protected function subjectPayload(object $notifiable): array
    {
        return $this->postSubject($this->post);
    }

    #[\Override]
    protected function metaPayload(object $notifiable): array
    {
        $postMeta = $this->postMeta($this->post);

        return $postMeta === [] ? [] : ['post' => $postMeta];
    }
}

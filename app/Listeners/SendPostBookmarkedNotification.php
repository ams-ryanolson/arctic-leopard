<?php

namespace App\Listeners;

use App\Events\PostBookmarked;
use App\Notifications\PostBookmarkedNotification;

class SendPostBookmarkedNotification
{
    /**
     * Handle the event.
     */
    public function handle(PostBookmarked $event): void
    {
        $post = $event->post->loadMissing('author');
        $author = $post->author;

        if ($author === null || $event->actor->is($author)) {
            return;
        }

        if ($event->actor->hasBlockRelationshipWith($author)) {
            return;
        }

        $author->notify(new PostBookmarkedNotification($event->actor, $post));
    }
}

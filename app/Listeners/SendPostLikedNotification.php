<?php

namespace App\Listeners;

use App\Events\PostLiked;
use App\Models\User;
use App\Notifications\PostLikedNotification;
use App\Services\Toasts\ToastBus;

class SendPostLikedNotification
{
    public function __construct(
        private readonly ToastBus $toastBus,
    ) {
    }

    /**
     * Handle the event.
     */
    public function handle(PostLiked $event): void
    {
        $post = $event->post->loadMissing('author');
        $author = $post->author;

        if ($author === null || $event->actor->is($author)) {
            return;
        }

        if ($event->actor->hasBlockRelationshipWith($author)) {
            return;
        }

        $actor = $event->actor;

        $alreadyNotified = $author->notifications()
            ->where('type', 'post-liked')
            ->whereJsonContains('data->actor->id', $actor->getKey())
            ->whereJsonContains('data->subject->id', $post->getKey())
            ->exists();

        if ($alreadyNotified) {
            return;
        }

        $author->notify(new PostLikedNotification($actor, $post));

        $toastId = sprintf('post-liked:%s:%s', $author->getKey(), $actor->getKey());

        $this->toastBus->info($author, sprintf('%s liked your post.', $this->actorLabel($actor)), [
            'id' => $toastId,
            'title' => 'New like',
            'actions' => [
                [
                    'key' => 'view-notifications',
                    'label' => 'View details',
                    'method' => 'router.visit',
                    'route' => route('notifications.index', ['filter' => 'unread']),
                ],
            ],
            'meta' => [
                'notification_type' => 'post-liked',
                'post_id' => $post->getKey(),
                'actor_id' => $actor->getKey(),
            ],
        ]);
    }

    private function actorLabel(User $user): string
    {
        if ($user->display_name) {
            return $user->display_name;
        }

        if ($user->username) {
            return '@'.$user->username;
        }

        return $user->name ?? 'Someone';
    }
}


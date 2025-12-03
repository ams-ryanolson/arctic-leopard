<?php

namespace App\Listeners;

use App\Events\PostAmplified;
use App\Models\User;
use App\Notifications\PostAmplifiedNotification;
use App\Services\Toasts\ToastBus;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendPostAmplifiedNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        private readonly ToastBus $toastBus,
    ) {}

    /**
     * Handle the event.
     */
    public function handle(PostAmplified $event): void
    {
        $post = $event->originalPost->loadMissing('author');
        $author = $post->author;

        if ($author === null || $event->actor->is($author)) {
            return;
        }

        if ($event->actor->hasBlockRelationshipWith($author)) {
            return;
        }

        $actor = $event->actor;

        $alreadyNotified = $author->notifications()
            ->where('type', 'post-amplified')
            ->whereJsonContains('data->actor->id', $actor->getKey())
            ->whereJsonContains('data->subject->id', $post->getKey())
            ->exists();

        if ($alreadyNotified) {
            return;
        }

        $author->notify(new PostAmplifiedNotification($actor, $post));

        $toastId = sprintf('post-amplified:%s:%s', $author->getKey(), $actor->getKey());

        $this->toastBus->info($author, sprintf('%s amplified your post.', $this->actorLabel($actor)), [
            'id' => $toastId,
            'title' => 'Post amplified',
            'actions' => [
                [
                    'key' => 'view-notifications',
                    'label' => 'View details',
                    'method' => 'router.visit',
                    'route' => route('notifications.index', ['filter' => 'unread']),
                ],
            ],
            'meta' => [
                'notification_type' => 'post-amplified',
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

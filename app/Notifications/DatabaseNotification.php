<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

/**
 * Base notification for database delivery with a consistent payload structure.
 */
abstract class DatabaseNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(protected User $actor) {}

    /**
     * Return the notification channels.
     *
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Get the array representation of the notification for persistence.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return $this->notificationPayload($notifiable);
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'notification' => [
                'id' => (string) $this->id,
                ...$this->notificationPayload($notifiable),
            ],
            'unread_count' => $this->unreadNotificationsCount($notifiable),
        ]);
    }

    /**
     * @return array<string, string>
     */
    public function viaQueues(): array
    {
        return [
            'database' => 'notifications',
            'broadcast' => 'notifications',
        ];
    }

    /**
     * Persist a human readable type so the frontend is decoupled from class names.
     */
    public function databaseType(object $notifiable): string
    {
        return static::class;
    }

    /**
     * Get the payload specific to the notification.
     *
     * @return array<string, mixed>
     */
    abstract protected function subjectPayload(object $notifiable): array;

    /**
     * Provide additional metadata for consumers.
     *
     * @return array<string, mixed>
     */
    protected function metaPayload(object $notifiable): array
    {
        return [];
    }

    /**
     * Structure the actor information consistently.
     *
     * @return array<string, mixed>
     */
    protected function actorPayload(): array
    {
        return [
            'id' => $this->actor->getKey(),
            'username' => $this->actor->username,
            'display_name' => $this->actor->display_name,
            'avatar_url' => $this->actor->avatar_url,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function notificationPayload(object $notifiable): array
    {
        return array_filter([
            'type' => $this->databaseType($notifiable),
            'actor' => $this->actorPayload(),
            'subject' => $this->subjectPayload($notifiable),
            'meta' => $this->metaPayload($notifiable),
        ], static fn ($value) => $value !== [] && $value !== null);
    }

    protected function unreadNotificationsCount(object $notifiable): int
    {
        return $notifiable instanceof User
            ? $notifiable->unreadNotifications()->count()
            : 0;
    }
}

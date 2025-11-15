<?php

namespace App\Notifications\Verification;

use App\Models\Verification;
use App\Notifications\DatabaseNotification;
use Illuminate\Notifications\Messages\MailMessage;

class CreatorStatusDisabledNotification extends DatabaseNotification
{
    public function __construct(
        public Verification $verification,
    ) {
        parent::__construct($verification->user);
    }

    public function databaseType(object $notifiable): string
    {
        return 'verification.creator_disabled';
    }

    protected function subjectPayload(object $notifiable): array
    {
        return [
            'verification_id' => $this->verification->getKey(),
            'expires_at' => $this->verification->expires_at?->toIso8601String(),
            'creator_status_disabled_at' => $this->verification->creator_status_disabled_at?->toIso8601String(),
        ];
    }

    protected function metaPayload(object $notifiable): array
    {
        return [
            'expires_at_human' => $this->verification->expires_at?->diffForHumans(),
            'disabled_at_human' => $this->verification->creator_status_disabled_at?->diffForHumans(),
        ];
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Creator Status Disabled - Verification Required')
            ->greeting('Hello '.($notifiable->display_name ?? $notifiable->username).',')
            ->line('Your creator status has been disabled because your ID verification has expired.')
            ->line('Your verification expired on '.$this->verification->expires_at?->format('F j, Y').'.')
            ->line('To restore your creator features, you must complete a new ID verification.')
            ->action('Complete Verification', \Illuminate\Support\Facades\URL::route('settings.account.verification'))
            ->line('Once your verification is approved, your creator status will be automatically restored.')
            ->line('If you have any questions, please contact support.');
    }
}

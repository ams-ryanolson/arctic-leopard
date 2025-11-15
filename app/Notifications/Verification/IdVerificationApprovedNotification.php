<?php

namespace App\Notifications\Verification;

use App\Models\Verification;
use App\Notifications\DatabaseNotification;
use Illuminate\Notifications\Messages\MailMessage;

class IdVerificationApprovedNotification extends DatabaseNotification
{
    public function __construct(
        public Verification $verification,
    ) {
        parent::__construct($verification->user);
    }

    public function databaseType(object $notifiable): string
    {
        return 'verification.approved';
    }

    protected function subjectPayload(object $notifiable): array
    {
        return [
            'verification_id' => $this->verification->getKey(),
            'verified_at' => $this->verification->verified_at?->toIso8601String(),
            'expires_at' => $this->verification->expires_at?->toIso8601String(),
        ];
    }

    protected function metaPayload(object $notifiable): array
    {
        return [
            'expires_at_human' => $this->verification->expires_at?->diffForHumans(),
        ];
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('ID Verification Approved')
            ->greeting('Hello '.($notifiable->display_name ?? $notifiable->username).',')
            ->line('Your ID verification has been approved successfully.')
            ->line('Your verification will expire on '.$this->verification->expires_at?->format('F j, Y').'.')
            ->action('View Creator Dashboard', \Illuminate\Support\Facades\URL::route('dashboard'))
            ->line('Thank you for verifying your identity!');
    }
}

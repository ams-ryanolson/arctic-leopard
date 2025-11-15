<?php

namespace App\Notifications\Verification;

use App\Models\Verification;
use App\Notifications\DatabaseNotification;
use Illuminate\Notifications\Messages\MailMessage;

class IdVerificationRenewalRequiredNotification extends DatabaseNotification
{
    public function __construct(
        public Verification $verification,
    ) {
        parent::__construct($verification->user);
    }

    public function databaseType(object $notifiable): string
    {
        return 'verification.renewal_required';
    }

    protected function subjectPayload(object $notifiable): array
    {
        $gracePeriodDays = (int) \App\Models\AdminSetting::get('id_verification_grace_period_days', 30);
        $gracePeriodEnd = $this->verification->expires_at?->copy()->addDays($gracePeriodDays);

        return [
            'verification_id' => $this->verification->getKey(),
            'expires_at' => $this->verification->expires_at?->toIso8601String(),
            'renewal_required_at' => $this->verification->renewal_required_at?->toIso8601String(),
            'grace_period_ends_at' => $gracePeriodEnd?->toIso8601String(),
            'compliance_note' => $this->verification->compliance_note,
        ];
    }

    protected function metaPayload(object $notifiable): array
    {
        $gracePeriodDays = (int) \App\Models\AdminSetting::get('id_verification_grace_period_days', 30);
        $gracePeriodEnd = $this->verification->expires_at?->copy()->addDays($gracePeriodDays);

        return [
            'expires_at_human' => $this->verification->expires_at?->diffForHumans(),
            'grace_period_ends_at_human' => $gracePeriodEnd?->diffForHumans(),
        ];
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $gracePeriodDays = (int) \App\Models\AdminSetting::get('id_verification_grace_period_days', 30);
        $gracePeriodEnd = $this->verification->expires_at?->copy()->addDays($gracePeriodDays);

        $message = (new MailMessage)
            ->subject('ID Verification Renewal Required - Action Needed')
            ->greeting('Hello '.($notifiable->display_name ?? $notifiable->username).',')
            ->line('Your ID verification is expiring soon and needs to be renewed.')
            ->line('Your current verification expires on '.$this->verification->expires_at?->format('F j, Y').'.')
            ->line('You have until '.$gracePeriodEnd?->format('F j, Y').' to renew your verification before your creator status is disabled.');

        if ($this->verification->compliance_note) {
            $message->line('**Compliance Note:** '.$this->verification->compliance_note);
        }

        return $message
            ->action('Renew Verification', \Illuminate\Support\Facades\URL::route('settings.account.verification'))
            ->line('Please renew your verification as soon as possible to avoid any disruption to your creator features.');
    }
}

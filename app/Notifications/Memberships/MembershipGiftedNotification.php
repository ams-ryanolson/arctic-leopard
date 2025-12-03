<?php

namespace App\Notifications\Memberships;

use App\Models\Memberships\UserMembership;
use App\Models\User;
use App\Notifications\DatabaseNotification;
use Illuminate\Notifications\Messages\MailMessage;

class MembershipGiftedNotification extends DatabaseNotification
{
    public const TYPE = 'membership-gifted';

    public function __construct(
        User $gifter,
        public UserMembership $membership
    ) {
        parent::__construct($gifter);
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database', 'broadcast'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $plan = $this->membership->plan;
        $gifterName = $this->actor->display_name ?? $this->actor->username;
        $expiresAt = $this->membership->ends_at?->format('F j, Y');

        $mail = (new MailMessage)
            ->subject("🎁 You've Received a Gift Membership!")
            ->greeting('Hey '.$notifiable->display_name.'!')
            ->line("{$gifterName} has gifted you a **{$plan->name}** membership!")
            ->line('How awesome is that? 🎉')
            ->line('')
            ->line('**Your Gift Details:**')
            ->line("• **Plan:** {$plan->name}");

        if ($expiresAt) {
            $mail->line("• **Valid Until:** {$expiresAt}");
        }

        return $mail
            ->action('Check It Out', url('/dashboard'))
            ->line('Enjoy your new membership!');
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
            'expires_at' => $this->membership->ends_at?->toIso8601String(),
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

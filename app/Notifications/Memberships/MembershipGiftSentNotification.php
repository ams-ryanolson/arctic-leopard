<?php

namespace App\Notifications\Memberships;

use App\Models\Memberships\UserMembership;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MembershipGiftSentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public User $recipient,
        public UserMembership $membership
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $plan = $this->membership->plan;
        $recipientName = $this->recipient->display_name ?? $this->recipient->username;
        $amount = number_format($this->membership->original_price / 100, 2);
        $currency = $plan->currency ?? 'USD';
        $expiresAt = $this->membership->ends_at?->format('F j, Y');

        $mail = (new MailMessage)
            ->subject('Your Gift Has Been Sent! 🎁')
            ->greeting('Hey '.$notifiable->display_name.'!')
            ->line("Great news! Your gift of a **{$plan->name}** membership has been successfully sent to **{$recipientName}**!")
            ->line('')
            ->line('**Gift Details:**')
            ->line("• **Plan:** {$plan->name}")
            ->line("• **Recipient:** {$recipientName}")
            ->line("• **Amount:** \${$amount} {$currency}");

        if ($expiresAt) {
            $mail->line("• **Valid Until:** {$expiresAt}");
        }

        return $mail
            ->line('')
            ->line("We've notified {$recipientName} about your generous gift. Thanks for spreading the love!")
            ->action('View Your Purchase History', url('/settings/membership'));
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $plan = $this->membership->plan;

        return [
            'type' => 'membership_gift_sent',
            'membership_id' => $this->membership->id,
            'plan_name' => $plan->name,
            'plan_id' => $plan->id,
            'amount' => $this->membership->original_price,
            'currency' => $plan->currency ?? 'USD',
            'recipient' => [
                'id' => $this->recipient->id,
                'username' => $this->recipient->username,
                'display_name' => $this->recipient->display_name,
            ],
            'expires_at' => $this->membership->ends_at?->toIso8601String(),
            'message' => "Your gift of {$plan->name} membership has been sent to {$this->recipient->display_name}!",
        ];
    }
}

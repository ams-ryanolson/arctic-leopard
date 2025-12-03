<?php

namespace App\Notifications;

use App\Models\Memberships\UserMembership;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MembershipPurchased extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
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
        $amount = number_format($this->membership->original_price / 100, 2);
        $currency = $plan->currency ?? 'USD';
        $expiresAt = $this->membership->ends_at?->format('F j, Y');
        $isGift = $this->membership->gifted_by_user_id !== null;

        $mail = (new MailMessage)
            ->subject($isGift ? 'You\'ve Received a Gift Membership!' : 'Welcome to '.$plan->name.' Membership!')
            ->greeting('Hey '.$notifiable->display_name.'!');

        if ($isGift) {
            $gifter = $this->membership->giftedBy;
            $mail->line($gifter->display_name.' has gifted you a '.$plan->name.' membership!')
                ->line('How awesome is that?');
        } else {
            $mail->line('Thank you for upgrading to '.$plan->name.'!')
                ->line('Your membership is now active and you have access to all the premium features.');
        }

        $mail->line('**Membership Details:**')
            ->line('• **Plan:** '.$plan->name)
            ->line('• **Amount Paid:** $'.$amount.' '.$currency);

        if ($this->membership->discount_amount > 0) {
            $discount = number_format($this->membership->discount_amount / 100, 2);
            $mail->line('• **Discount Applied:** $'.$discount.' '.$currency);
        }

        if ($expiresAt) {
            $mail->line('• **Valid Until:** '.$expiresAt);
        }

        if ($this->membership->billing_type === 'recurring') {
            $nextBilling = $this->membership->next_billing_at?->format('F j, Y');
            if ($nextBilling) {
                $mail->line('• **Next Billing Date:** '.$nextBilling);
            }
            $mail->line('')
                ->line('Your membership will automatically renew. You can manage or cancel your subscription anytime from your account settings.');
        }

        return $mail
            ->action('Explore Your Membership', url('/dashboard'))
            ->line('Thanks for being part of our community!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $plan = $this->membership->plan;
        $isGift = $this->membership->gifted_by_user_id !== null;

        return [
            'type' => 'membership_purchased',
            'membership_id' => $this->membership->id,
            'plan_name' => $plan->name,
            'plan_id' => $plan->id,
            'amount' => $this->membership->original_price,
            'currency' => $plan->currency ?? 'USD',
            'expires_at' => $this->membership->ends_at?->toIso8601String(),
            'is_gift' => $isGift,
            'gifted_by' => $isGift ? $this->membership->giftedBy?->display_name : null,
            'message' => $isGift
                ? "You've received a {$plan->name} membership as a gift!"
                : "Welcome to {$plan->name}! Your membership is now active.",
        ];
    }
}

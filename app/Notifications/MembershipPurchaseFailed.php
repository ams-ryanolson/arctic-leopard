<?php

namespace App\Notifications;

use App\Models\Memberships\MembershipPlan;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MembershipPurchaseFailed extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public MembershipPlan $plan,
        public string $reason,
        public int $amount,
        public ?string $declineCode = null
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
        $formattedAmount = number_format($this->amount / 100, 2);
        $currency = $this->plan->currency ?? 'USD';

        $mail = (new MailMessage)
            ->subject('Payment Failed for '.$this->plan->name.' Membership')
            ->greeting('Hey '.$notifiable->display_name.',')
            ->line('We were unable to process your payment for the '.$this->plan->name.' membership.')
            ->line('')
            ->line('**Payment Details:**')
            ->line('• **Plan:** '.$this->plan->name)
            ->line('• **Amount:** $'.$formattedAmount.' '.$currency)
            ->line('')
            ->line('**Reason:** '.$this->getHumanReadableReason());

        if ($this->declineCode) {
            $mail->line('• **Error Code:** '.$this->declineCode);
        }

        return $mail
            ->line('')
            ->line('**What you can do:**')
            ->line('• Check that your card details are correct')
            ->line('• Ensure you have sufficient funds')
            ->line('• Try a different payment method')
            ->line('• Contact your bank if the issue persists')
            ->action('Try Again', url('/upgrade'))
            ->line('')
            ->line('If you continue to experience issues, please contact our support team.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'membership_purchase_failed',
            'plan_name' => $this->plan->name,
            'plan_id' => $this->plan->id,
            'amount' => $this->amount,
            'currency' => $this->plan->currency ?? 'USD',
            'reason' => $this->reason,
            'decline_code' => $this->declineCode,
            'message' => "Payment failed for {$this->plan->name} membership: {$this->getHumanReadableReason()}",
        ];
    }

    /**
     * Convert technical decline reasons to human-readable messages.
     */
    protected function getHumanReadableReason(): string
    {
        $reasons = [
            'insufficient_funds' => 'Insufficient funds in your account',
            'card_declined' => 'Your card was declined',
            'expired_card' => 'Your card has expired',
            'incorrect_cvc' => 'The security code (CVV) was incorrect',
            'processing_error' => 'There was a processing error. Please try again.',
            'card_not_supported' => 'This card type is not supported',
            'currency_not_supported' => 'This currency is not supported',
            'duplicate_transaction' => 'This appears to be a duplicate transaction',
            'fraudulent' => 'This transaction was flagged for security reasons',
            'lost_card' => 'This card has been reported lost',
            'stolen_card' => 'This card has been reported stolen',
            'generic_decline' => 'Your card was declined. Please contact your bank.',
        ];

        // Check if the reason matches any known patterns
        $lowerReason = strtolower($this->reason);

        foreach ($reasons as $key => $message) {
            if (str_contains($lowerReason, str_replace('_', ' ', $key)) || str_contains($lowerReason, $key)) {
                return $message;
            }
        }

        // Return the original reason if no match found
        return $this->reason ?: 'An unknown error occurred';
    }
}

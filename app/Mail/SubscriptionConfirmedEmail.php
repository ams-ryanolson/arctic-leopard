<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SubscriptionConfirmedEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $subscriber,
        public User $creator,
        public string $amount,
        public string $planName,
    ) {}

    public function envelope(): Envelope
    {
        $creatorName = $this->creator->display_name ?? $this->creator->username;

        return new Envelope(
            subject: "You're now subscribed to {$creatorName}!",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.subscription-confirmed',
            with: [
                'username' => $this->subscriber->display_name ?? $this->subscriber->username,
                'creatorUsername' => $this->creator->display_name ?? $this->creator->username,
                'amount' => $this->amount,
                'planName' => $this->planName,
                'dashboardUrl' => url('/dashboard'),
            ],
        );
    }
}


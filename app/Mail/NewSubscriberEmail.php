<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewSubscriberEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $creator,
        public User $subscriber,
        public string $subscriptionAmount,
    ) {}

    public function envelope(): Envelope
    {
        $subscriberName = $this->subscriber->display_name ?? $this->subscriber->username;

        return new Envelope(
            subject: "🎉 {$subscriberName} just subscribed to you!",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.new-subscriber',
            with: [
                'creatorUsername' => $this->creator->display_name ?? $this->creator->username,
                'subscriberUsername' => $this->subscriber->display_name ?? $this->subscriber->username,
                'subscriptionAmount' => $this->subscriptionAmount,
                'profileUrl' => route('profile.show', $this->creator->username),
            ],
        );
    }
}


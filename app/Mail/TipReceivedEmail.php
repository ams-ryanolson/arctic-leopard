<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TipReceivedEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $creator,
        public User $tipper,
        public string $amount,
        public ?string $message = null,
    ) {}

    public function envelope(): Envelope
    {
        $tipperName = $this->tipper->display_name ?? $this->tipper->username;

        return new Envelope(
            subject: "💰 {$tipperName} sent you a {$this->amount} tip!",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.tip-received',
            with: [
                'creatorUsername' => $this->creator->display_name ?? $this->creator->username,
                'tipperUsername' => $this->tipper->display_name ?? $this->tipper->username,
                'amount' => $this->amount,
                'message' => $this->message ?? '',
                'profileUrl' => route('profile.show', $this->creator->username),
            ],
        );
    }
}


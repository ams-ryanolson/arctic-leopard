<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VerificationApprovedEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $verificationType = 'identity', // 'identity' or 'creator'
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->verificationType === 'creator'
            ? '🎉 Your creator application is approved!'
            : '✓ Your identity is verified!';

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.verification-approved',
            with: [
                'username' => $this->user->display_name ?? $this->user->username,
                'verificationType' => $this->verificationType,
            ],
        );
    }
}


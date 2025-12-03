<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BetaInvitationEmail extends Mailable
{
    use SerializesModels;

    public function __construct(
        public User $user,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "🎉 You're Invited to the New Real Kink Men Beta!",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.beta-invitation',
            with: [
                'username' => $this->user->username,
                'displayName' => $this->user->display_name ?? $this->user->username,
                'resetPasswordUrl' => url('/forgot-password'),
            ],
        );
    }
}

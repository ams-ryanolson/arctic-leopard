<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class PasswordChangedEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public ?string $ipAddress = null,
        public ?string $location = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Password Was Changed',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.password-changed',
            with: [
                'username' => $this->user->display_name ?? $this->user->username,
                'changedAt' => Carbon::now()->format('F j, Y \a\t g:i A T'),
                'ipAddress' => $this->ipAddress ?? 'Unknown',
                'location' => $this->location ?? 'Unknown',
            ],
        );
    }
}


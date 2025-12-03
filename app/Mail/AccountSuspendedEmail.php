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

class AccountSuspendedEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $reason,
        public string $suspensionType = 'temporary', // 'temporary' or 'permanent'
        public ?Carbon $expiresAt = null,
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->suspensionType === 'permanent'
            ? 'Your account has been permanently suspended'
            : 'Your account has been temporarily suspended';

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.account-suspended',
            with: [
                'username' => $this->user->display_name ?? $this->user->username,
                'reason' => $this->reason,
                'suspensionType' => $this->suspensionType,
                'expiresAt' => $this->expiresAt?->format('F j, Y'),
                'appealUrl' => url('/appeal'),
            ],
        );
    }
}


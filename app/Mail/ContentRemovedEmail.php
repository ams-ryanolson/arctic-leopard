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

class ContentRemovedEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $contentType, // 'post', 'comment', 'message', 'profile'
        public string $reason,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your {$this->contentType} was removed",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.content-removed',
            with: [
                'username' => $this->user->display_name ?? $this->user->username,
                'contentType' => $this->contentType,
                'reason' => $this->reason,
                'removedAt' => Carbon::now()->format('F j, Y'),
                'appealUrl' => url('/appeal'),
            ],
        );
    }
}


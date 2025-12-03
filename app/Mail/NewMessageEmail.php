<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

class NewMessageEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $recipient,
        public User $sender,
        public string $messagePreview,
        public string $conversationId,
    ) {}

    public function envelope(): Envelope
    {
        $senderName = $this->sender->display_name ?? $this->sender->username;

        return new Envelope(
            subject: "New message from {$senderName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.new-message',
            with: [
                'username' => $this->recipient->display_name ?? $this->recipient->username,
                'senderUsername' => $this->sender->display_name ?? $this->sender->username,
                'messagePreview' => Str::limit($this->messagePreview, 100),
                'conversationUrl' => url("/messages/{$this->conversationId}"),
            ],
        );
    }
}


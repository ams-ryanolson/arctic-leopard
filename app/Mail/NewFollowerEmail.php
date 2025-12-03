<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewFollowerEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public User $follower,
    ) {}

    public function envelope(): Envelope
    {
        $followerName = $this->follower->display_name ?? $this->follower->username;

        return new Envelope(
            subject: "{$followerName} is now following you!",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.new-follower',
            with: [
                'username' => $this->user->display_name ?? $this->user->username,
                'followerUsername' => $this->follower->display_name ?? $this->follower->username,
                'followerProfileUrl' => route('profile.show', $this->follower->username),
            ],
        );
    }
}


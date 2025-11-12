<?php

namespace App\Notifications\Messages;

use App\Models\Message;
use App\Models\User;
use App\Notifications\DatabaseNotification;
use Illuminate\Support\Str;

class MessageReceivedNotification extends DatabaseNotification
{
    public function __construct(
        public Message $message,
    ) {
        $author = $message->author ?? $message->author()->first();

        if (! $author instanceof User) {
            throw new \InvalidArgumentException('A message author is required to send notifications.');
        }

        parent::__construct($author);
    }

    protected function subjectPayload(object $notifiable): array
    {
        return [
            'message_id' => $this->message->getKey(),
            'conversation_id' => $this->message->conversation_id,
            'preview' => Str::limit($this->message->body ?? '', 140),
        ];
    }

    protected function metaPayload(object $notifiable): array
    {
        return array_filter([
            'attachments' => $this->message->attachments
                ? $this->message->attachments->map(fn ($attachment) => [
                    'id' => $attachment->getKey(),
                    'type' => $attachment->type,
                ])->all()
                : null,
            'conversation_subject' => $this->message->conversation->subject,
        ]);
    }

    public function databaseType(object $notifiable): string
    {
        return 'messages.received';
    }
}

<?php

namespace App\Events\Messaging;

use App\Http\Resources\MessageResource;
use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public Message $message,
    ) {}

    /**
     * @return array<int, \Illuminate\Broadcasting\PresenceChannel>
     */
    public function broadcastOn(): array
    {
        $this->message->loadMissing('conversation');

        return [
            new PresenceChannel(sprintf('conversations.%s', $this->message->conversation->ulid)),
        ];
    }

    public function broadcastAs(): string
    {
        return 'MessageSent';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $this->message->loadMissing(['author', 'attachments', 'reactions']);

        return [
            'message' => MessageResource::make($this->message)->resolve(),
        ];
    }
}

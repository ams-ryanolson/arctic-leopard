<?php

namespace App\Events\Messaging;

use App\Http\Resources\MessageResource;
use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
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
        return [
            new PresenceChannel(sprintf('conversations.%d', $this->message->conversation_id)),
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

<?php

namespace App\Events\Messaging;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageRead implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public Conversation $conversation,
        public User $user,
        public ?Message $message = null,
    ) {}

    /**
     * @return array<int, \Illuminate\Broadcasting\PresenceChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PresenceChannel(sprintf('conversations.%s', $this->conversation->ulid)),
        ];
    }

    public function broadcastAs(): string
    {
        return 'MessageRead';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->user->getKey(),
            'message_id' => $this->message?->getKey(),
            'read_at' => $this->message?->created_at?->toIso8601String(),
        ];
    }
}

<?php

namespace App\Events\Messaging;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageReactionUpdated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    /**
     * @param  array<int, array<string, mixed>>  $reactionSummary
     */
    public function __construct(
        public Message $message,
        public array $reactionSummary,
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
        return 'MessageReactionUpdated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'message_id' => $this->message->getKey(),
            'reaction_summary' => $this->reactionSummary,
        ];
    }
}

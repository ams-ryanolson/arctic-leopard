<?php

namespace App\Services\Messaging;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Carbon;

class MessageAnalyticsService
{
    public function __construct(
        private ConnectionInterface $connection,
    ) {}

    public function recordMessageSent(Message $message): void
    {
        $this->incrementMetrics(
            $message->conversation,
            $message->author,
            [
                'messages_sent' => 1,
                'attachments_sent' => $message->attachments()->count(),
            ],
        );
    }

    public function recordSystemMessage(Conversation $conversation): void
    {
        $this->incrementMetrics($conversation, null, [
            'system_messages_sent' => 1,
        ]);
    }

    public function recordReaction(Message $message, User $user): void
    {
        $this->incrementMetrics($message->conversation, $user, [
            'reactions_added' => 1,
        ]);
    }

    /**
     * @param  array<string, int>  $increments
     */
    protected function incrementMetrics(?Conversation $conversation, ?User $user, array $increments): void
    {
        $date = Carbon::now()->startOfDay()->toDateString();
        $conversationId = $conversation?->getKey();
        $userId = $user?->getKey();

        $this->connection->table('message_metrics')
            ->upsert([
                'recorded_on' => $date,
                'conversation_id' => $conversationId,
                'user_id' => $userId,
                ...$increments,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ], ['recorded_on', 'conversation_id', 'user_id'], array_keys($increments));
    }
}

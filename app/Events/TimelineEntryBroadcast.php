<?php

namespace App\Events;

use App\Models\Post;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class TimelineEntryBroadcast implements ShouldBroadcast
{
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public int $timelineId,
        public int $userId,
        public Post $post,
        public string $visibilitySource,
    ) {
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("timeline.{$this->userId}");
    }

    public function broadcastAs(): string
    {
        return 'TimelineEntryBroadcast';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $author = $this->post->author;

        return [
            'timeline_id' => $this->timelineId,
            'post_id' => $this->post->getKey(),
            'visibility_source' => $this->visibilitySource,
            'post' => [
                'id' => $this->post->getKey(),
                'type' => $this->post->type->value ?? $this->post->type,
                'audience' => $this->post->audience->value ?? $this->post->audience,
                'body' => $this->post->body,
                'published_at' => optional($this->post->published_at)->toIso8601String(),
                'created_at' => optional($this->post->created_at)->toIso8601String(),
                'author' => $author ? [
                    'id' => $author->getKey(),
                    'display_name' => $author->display_name ?? $author->name,
                    'username' => $author->username,
                    'avatar_url' => $author->avatar_url,
                ] : null,
            ],
        ];
    }
}



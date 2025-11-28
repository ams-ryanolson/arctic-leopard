<?php

namespace App\Events\Content;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ContentRejected
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public \Illuminate\Database\Eloquent\Model $content,
        public \App\Models\User $moderator,
        public string $reason,
    ) {}
}

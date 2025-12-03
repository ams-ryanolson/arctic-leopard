<?php

namespace App\Events\LiveStreaming;

use App\Models\LiveStream;
use App\Models\LiveStreamChatMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatMessageSent
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public LiveStream $stream,
        public LiveStreamChatMessage $message,
    ) {}
}

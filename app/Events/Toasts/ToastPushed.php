<?php

namespace App\Events\Toasts;

use App\Models\User;
use App\Support\Toasts\ToastPayload;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ToastPushed implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public User $user,
        public ToastPayload $payload,
    ) {
    }

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel(sprintf('users.%d.toasts', $this->user->getKey()));
    }

    public function broadcastQueue(): string
    {
        return 'notifications';
    }

    public function broadcastWith(): array
    {
        return $this->payload->toArray();
    }

    public function broadcastAs(): string
    {
        return 'ToastPushed';
    }
}


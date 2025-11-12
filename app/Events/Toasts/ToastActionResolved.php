<?php

namespace App\Events\Toasts;

use App\Models\User;
use App\Support\Toasts\ToastPayload;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ToastActionResolved
{
    use Dispatchable;
    use SerializesModels;

    /**
     * @param  array<string, mixed>  $input
     */
    public function __construct(
        public User $user,
        public ToastPayload $payload,
        public string $actionKey,
        public array $input = [],
    ) {
    }
}





<?php

namespace App\Events\Toasts;

use App\Models\User;
use App\Support\Toasts\ToastPayload;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ToastAcknowledged
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public User $user,
        public ToastPayload $payload,
    ) {
    }
}





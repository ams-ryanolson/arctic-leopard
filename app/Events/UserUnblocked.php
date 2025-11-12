<?php

namespace App\Events;

use App\Models\UserBlock;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserUnblocked
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public UserBlock $block,
    ) {}
}






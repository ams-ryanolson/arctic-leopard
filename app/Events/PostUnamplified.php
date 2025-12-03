<?php

namespace App\Events;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PostUnamplified
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public User $actor,
        public Post $originalPost,
    ) {}
}

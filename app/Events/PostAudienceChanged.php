<?php

namespace App\Events;

use App\Enums\PostAudience;
use App\Models\Post;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PostAudienceChanged
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public Post $post,
        public PostAudience $previousAudience,
        public PostAudience $newAudience,
    ) {}
}

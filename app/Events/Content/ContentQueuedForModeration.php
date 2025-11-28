<?php

namespace App\Events\Content;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ContentQueuedForModeration
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public Model $content,
    ) {}
}

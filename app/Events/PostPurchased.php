<?php

namespace App\Events;

use App\Models\PostPurchase;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PostPurchased
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public PostPurchase $purchase) {}
}

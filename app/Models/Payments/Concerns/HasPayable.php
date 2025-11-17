<?php

namespace App\Models\Payments\Concerns;

use Illuminate\Database\Eloquent\Relations\MorphTo;

trait HasPayable
{
    /**
     * Get the payable entity associated with the model.
     */
    public function payable(): MorphTo
    {
        return $this->morphTo();
    }
}

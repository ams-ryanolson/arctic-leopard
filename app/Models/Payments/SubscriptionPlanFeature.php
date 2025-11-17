<?php

namespace App\Models\Payments;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionPlanFeature extends Model
{
    use HasFactory;

    public $timestamps = true;

    protected $guarded = [];

    protected static function newFactory()
    {
        return \Database\Factories\Payments\SubscriptionPlanFeatureFactory::new();
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }
}

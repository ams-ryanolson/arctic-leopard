<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model for querying SocialEngine 4 payment subscriptions table.
 * Uses the 'se4' database connection.
 */
class SE4PaymentSubscription extends Model
{
    protected $connection = 'se4';

    protected $table = 'engine4_payment_subscriptions';

    protected $primaryKey = 'subscription_id';

    public $timestamps = false;

    protected $casts = [
        'subscription_id' => 'integer',
        'user_id' => 'integer',
        'sender_id' => 'integer',
        'package_id' => 'integer',
        'active' => 'boolean',
        'gateway_id' => 'integer',
        'creation_date' => 'datetime',
        'modified_date' => 'datetime',
        'payment_date' => 'datetime',
        'expiration_date' => 'datetime',
    ];

    /**
     * Get the package for this subscription.
     */
    public function package()
    {
        return $this->belongsTo(SE4PaymentPackage::class, 'package_id', 'package_id');
    }
}

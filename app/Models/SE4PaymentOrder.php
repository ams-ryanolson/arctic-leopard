<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SE4PaymentOrder extends Model
{
    protected $connection = 'se4';

    protected $table = 'engine4_payment_orders';

    protected $primaryKey = 'order_id';

    public $timestamps = false;

    protected $casts = [
        'user_id' => 'integer',
        'gateway_id' => 'integer',
        'source_id' => 'integer',
        'creation_date' => 'datetime',
    ];

    public function transactions()
    {
        return $this->hasMany(SE4PaymentTransaction::class, 'order_id', 'order_id');
    }

    public function subscription()
    {
        return $this->belongsTo(SE4PaymentSubscription::class, 'source_id', 'subscription_id')
            ->where('source_type', 'payment_subscription');
    }
}

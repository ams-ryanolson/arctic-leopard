<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SE4PaymentTransaction extends Model
{
    protected $connection = 'se4';

    protected $table = 'engine4_payment_transactions';

    protected $primaryKey = 'transaction_id';

    public $timestamps = false;

    protected $casts = [
        'user_id' => 'integer',
        'gateway_id' => 'integer',
        'order_id' => 'integer',
        'amount' => 'decimal:2',
        'timestamp' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(SE4PaymentOrder::class, 'order_id', 'order_id');
    }
}

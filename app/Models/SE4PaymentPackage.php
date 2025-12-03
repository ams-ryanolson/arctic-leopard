<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model for querying SocialEngine 4 payment packages table.
 * Uses the 'se4' database connection.
 */
class SE4PaymentPackage extends Model
{
    protected $connection = 'se4';

    protected $table = 'engine4_payment_packages';

    protected $primaryKey = 'package_id';

    public $timestamps = false;

    protected $casts = [
        'package_id' => 'integer',
        'level_id' => 'integer',
        'downgrade_level_id' => 'integer',
        'price' => 'decimal:2',
        'recurrence' => 'integer',
        'duration' => 'integer',
        'trial_duration' => 'integer',
        'enabled' => 'boolean',
        'signup' => 'boolean',
        'after_signup' => 'boolean',
        'default' => 'boolean',
    ];

    /**
     * Check if this is a lifetime package (never expires).
     */
    public function isLifetime(): bool
    {
        return $this->duration_type === 'forever';
    }
}

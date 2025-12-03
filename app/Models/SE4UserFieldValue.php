<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model for querying SocialEngine 4 user field values table.
 * Uses the 'se4' database connection.
 *
 * In SE4, item_id = user_id for user field values.
 * Field ID 6 = Birthdate
 */
class SE4UserFieldValue extends Model
{
    protected $connection = 'se4';

    protected $table = 'engine4_user_fields_values';

    public $timestamps = false;

    public $incrementing = false;

    protected $primaryKey = null;

    protected $fillable = [
        'item_id',
        'field_id',
        'value',
    ];
}

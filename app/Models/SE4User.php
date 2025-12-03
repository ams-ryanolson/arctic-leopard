<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model for querying SocialEngine 4 users table.
 * Uses the 'se4' database connection.
 */
class SE4User extends Model
{
    protected $connection = 'se4';

    protected $table = 'engine4_users';

    protected $primaryKey = 'user_id';

    public $timestamps = false;

    protected $casts = [
        'enabled' => 'boolean',
        'verified' => 'boolean',
        'approved' => 'boolean',
        'search' => 'boolean',
        'show_profileviewers' => 'boolean',
        'featured' => 'boolean',
        'sponsored' => 'boolean',
        'vip' => 'boolean',
        'offtheday' => 'boolean',
        'creation_date' => 'datetime',
        'modified_date' => 'datetime',
        'lastlogin_date' => 'datetime',
        'status_date' => 'datetime',
        'starttime' => 'date',
        'endtime' => 'date',
    ];
}

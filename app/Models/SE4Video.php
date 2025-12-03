<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model for querying SocialEngine 4 videos table.
 * Uses the 'se4' database connection.
 */
class SE4Video extends Model
{
    protected $connection = 'se4';

    protected $table = 'engine4_video_videos';

    protected $primaryKey = 'video_id';

    public $timestamps = false;

    protected $casts = [
        'search' => 'boolean',
        'view_count' => 'integer',
        'comment_count' => 'integer',
        'type' => 'integer',
        'rating' => 'float',
        'duration' => 'integer',
        'rotation' => 'integer',
        'featured' => 'boolean',
        'sponsored' => 'boolean',
        'favorite_count' => 'integer',
        'favourite_count' => 'integer',
        'is_locked' => 'boolean',
        'is_featured' => 'boolean',
        'is_sponsored' => 'boolean',
        'is_hot' => 'boolean',
        'like_count' => 'integer',
        'approve' => 'boolean',
        'adult' => 'boolean',
        'creation_date' => 'datetime',
        'modified_date' => 'datetime',
        'starttime' => 'date',
        'endtime' => 'date',
    ];

    /**
     * Get the storage file for this video (service_id = 14 for CDN).
     */
    public function storageFile()
    {
        return $this->hasOne(SE4StorageFile::class, 'file_id', 'file_id')
            ->where('service_id', 14);
    }
}

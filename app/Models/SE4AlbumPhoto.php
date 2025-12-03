<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SE4AlbumPhoto extends Model
{
    protected $connection = 'se4';

    protected $table = 'engine4_album_photos';

    protected $primaryKey = 'photo_id';

    public $timestamps = false;

    protected $casts = [
        'photo_id' => 'integer',
        'album_id' => 'integer',
        'file_id' => 'integer',
        'owner_id' => 'integer',
        'order' => 'integer',
        'view_count' => 'integer',
        'comment_count' => 'integer',
        'like_count' => 'integer',
        'rating' => 'float',
        'download_count' => 'integer',
        'favourite_count' => 'integer',
        'creation_date' => 'datetime',
        'modified_date' => 'datetime',
        'taken_date' => 'date',
        'starttime' => 'date',
        'endtime' => 'date',
        'he_featured' => 'boolean',
        'offtheday' => 'boolean',
        'is_featured' => 'boolean',
        'is_sponsored' => 'boolean',
    ];

    public function storageFile()
    {
        return $this->hasOne(SE4StorageFile::class, 'file_id', 'file_id')
            ->where('service_id', 14);
    }
}

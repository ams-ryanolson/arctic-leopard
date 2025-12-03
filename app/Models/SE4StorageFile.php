<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Model for querying SocialEngine 4 storage files table.
 * Uses the 'se4' database connection.
 */
class SE4StorageFile extends Model
{
    protected $connection = 'se4';

    protected $table = 'engine4_storage_files';

    protected $primaryKey = 'file_id';

    public $timestamps = false;

    protected $casts = [
        'file_id' => 'integer',
        'parent_file_id' => 'integer',
        'parent_id' => 'integer',
        'user_id' => 'integer',
        'service_id' => 'integer',
        'size' => 'integer',
        'creation_date' => 'datetime',
        'modified_date' => 'datetime',
    ];

    /**
     * Get the full CDN URL for this file.
     */
    public function getCdnUrl(): string
    {
        if ($this->service_id === 14) {
            return 'https://cdn.fetishmen.net/'.ltrim($this->storage_path, '/');
        }

        // Fallback for other service IDs if needed
        return 'https://cdn.fetishmen.net/'.ltrim($this->storage_path, '/');
    }

    /**
     * Get the MIME type from mime_major and mime_minor.
     */
    public function getMimeType(): string
    {
        return trim($this->mime_major.'/'.$this->mime_minor);
    }
}

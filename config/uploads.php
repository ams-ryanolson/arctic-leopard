<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Temporary Upload Disk
    |--------------------------------------------------------------------------
    |
    | Files uploaded through FilePond are first stored on this disk before
    | they are attached to a model. By default we rely on the default
    | filesystem disk but you can override it via UPLOAD_TMP_DISK.
    |
    */

    'temporary_disk' => env('UPLOAD_TMP_DISK', env('FILESYSTEM_DISK', 'local')),

    /*
    |--------------------------------------------------------------------------
    | Temporary Directory
    |--------------------------------------------------------------------------
    |
    | Directory (within the chosen disk) where temporary uploads will be
    | stored until they are finalized. Feel free to customise if you
    | would prefer a different directory structure.
    |
    */

    'temporary_directory' => env('UPLOAD_TMP_DIRECTORY', 'tmp/uploads'),

    /*
    |--------------------------------------------------------------------------
    | Maximum File Size (Kilobytes)
    |--------------------------------------------------------------------------
    |
    | The maximum upload size for a single file. Default is 100 MB (in KB).
    | Adjust as required for your project or per disk limitations.
    | Note: Ensure PHP's upload_max_filesize and post_max_size are set higher.
    |
    */

    'max_file_size' => (int) env('UPLOAD_MAX_FILE_SIZE', 100 * 1024),

    /*
    |--------------------------------------------------------------------------
    | Allowed Mime Types
    |--------------------------------------------------------------------------
    |
    | Mime types that may be uploaded via FilePond. These will be used both
    | on the client (acceptedFileTypes) and validated on the server.
    |
    */

    'allowed_mime_types' => [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/avif',
    ],

    /*
    |--------------------------------------------------------------------------
    | Temporary File Lifetime (Minutes)
    |--------------------------------------------------------------------------
    |
    | Files left in the temporary upload bucket will be deleted after this
    | amount of minutes by the scheduled cleanup command.
    |
    */

    'temporary_ttl_minutes' => (int) env('UPLOAD_TMP_TTL', 60),
];



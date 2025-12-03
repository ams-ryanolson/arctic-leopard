<?php

return [
    /*
    |--------------------------------------------------------------------------
    | FFmpeg Configuration
    |--------------------------------------------------------------------------
    |
    | Paths to FFmpeg and FFprobe executables. These are used for video
    | processing, conversion, and metadata extraction.
    |
    */

    'ffmpeg_path' => env('FFMPEG_PATH', '/opt/homebrew/bin/ffmpeg'),
    'ffprobe_path' => env('FFPROBE_PATH', '/opt/homebrew/bin/ffprobe'),

    /*
    |--------------------------------------------------------------------------
    | Video Processing Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for video conversion and processing.
    |
    */

    'video' => [
        // Codec settings for MP4 conversion
        'video_codec' => 'libx264',
        'audio_codec' => 'aac',

        // Quality settings (preserve original quality)
        'crf' => 18, // Lower = higher quality (18 is visually lossless)
        'preset' => 'slow', // Encoding speed vs compression (slow = better compression)

        // Audio settings
        'audio_bitrate' => '192k',
        'audio_sample_rate' => 44100,

        // Thumbnail settings
        'thumbnail_time' => 0.1, // 10% of video duration
        'thumbnail_format' => 'jpg',
        'thumbnail_quality' => 85,

        // Temporary file storage
        'temp_dir' => storage_path('app/temp/videos'),
    ],
];

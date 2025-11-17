<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Story Expiration
    |--------------------------------------------------------------------------
    |
    | Default number of hours before a story expires after being published.
    |
    */

    'expiration_hours' => (int) env('STORIES_EXPIRATION_HOURS', 24),

    /*
    |--------------------------------------------------------------------------
    | Maximum Stories Per User
    |--------------------------------------------------------------------------
    |
    | Maximum number of active stories a user can have at once.
    |
    */

    'max_stories_per_user' => (int) env('STORIES_MAX_PER_USER', 20),

    /*
    |--------------------------------------------------------------------------
    | Story Viewer Auto-Advance
    |--------------------------------------------------------------------------
    |
    | Number of seconds before automatically advancing to the next story
    | in the story viewer.
    |
    */

    'auto_advance_seconds' => (int) env('STORIES_AUTO_ADVANCE_SECONDS', 7),

    /*
    |--------------------------------------------------------------------------
    | Allowed Reactions
    |--------------------------------------------------------------------------
    |
    | List of emoji reactions that can be used on stories.
    |
    */

    'allowed_reactions' => [
        '❤️',
        '🔥',
        '👍',
        '😍',
        '😮',
    ],

    /*
    |--------------------------------------------------------------------------
    | Viewer Timeout
    |--------------------------------------------------------------------------
    |
    | Number of seconds a story must be displayed before marking it as viewed.
    |
    */

    'viewer_timeout_seconds' => (int) env('STORIES_VIEWER_TIMEOUT_SECONDS', 5),
];

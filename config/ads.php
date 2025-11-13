<?php

use App\Enums\Ads\AdPlacement;
use App\Enums\Ads\AdSize;

return [
    'placements' => [
        AdPlacement::TimelineInline->value => [
            'name' => 'Timeline Inline',
            'allowed_sizes' => [AdSize::Small->value, AdSize::Medium->value],
            'default_weight' => 100,
            'injection_interval' => 6, // Every 6 posts
        ],
        AdPlacement::DashboardSidebarSmall->value => [
            'name' => 'Dashboard Sidebar Small',
            'allowed_sizes' => [AdSize::Small->value, AdSize::Square->value],
            'default_weight' => 100,
        ],
        AdPlacement::DashboardSidebarMedium->value => [
            'name' => 'Dashboard Sidebar Medium',
            'allowed_sizes' => [AdSize::Medium->value],
            'default_weight' => 100,
        ],
        AdPlacement::DashboardSidebarLarge->value => [
            'name' => 'Dashboard Sidebar Large',
            'allowed_sizes' => [AdSize::Large->value, AdSize::Banner->value],
            'default_weight' => 100,
        ],
    ],

    'pricing' => [
        'default_cpm' => 500, // $5.00 per 1000 impressions
        'default_cpc' => 50, // $0.50 per click
        'default_cpa' => 100, // $1.00 per action
    ],

    'caps' => [
        'max_daily_impressions_per_user' => 10,
        'max_daily_clicks_per_user' => 3,
    ],
];

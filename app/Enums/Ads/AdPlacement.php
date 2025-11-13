<?php

namespace App\Enums\Ads;

use App\Enums\Concerns\HasValues;

enum AdPlacement: string
{
    use HasValues;

    case TimelineInline = 'timeline_inline';
    case DashboardSidebarSmall = 'dashboard_sidebar_small';
    case DashboardSidebarMedium = 'dashboard_sidebar_medium';
    case DashboardSidebarLarge = 'dashboard_sidebar_large';
}

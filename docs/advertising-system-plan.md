# Advertising System Architecture Plan

## Overview

This document outlines the complete architecture for a comprehensive advertising management system that supports:
- Random ads in timeline/feed
- Multiple ad sizes
- Dashboard sidebar ads
- Admin management interface
- Advertiser self-serve portal
- Auto-sell functionality (like Twitter/Facebook)
- Comprehensive reporting and analytics

## Database Schema

### Core Tables

#### `ads`
- `id` (primary key)
- `uuid` (unique identifier)
- `advertiser_id` (foreign key to users - the advertiser)
- `campaign_id` (foreign key to ad_campaigns, nullable)
- `name` (string) - Internal name for the ad
- `status` (enum: draft, pending_review, active, paused, expired, rejected)
- `start_date` (datetime, nullable)
- `end_date` (datetime, nullable)
- `max_impressions` (unsigned big integer, nullable) - Total impression cap
- `max_clicks` (unsigned big integer, nullable) - Total click cap
- `daily_impression_cap` (unsigned big integer, nullable) - Daily limit
- `daily_click_cap` (unsigned big integer, nullable) - Daily click limit
- `budget_amount` (unsigned big integer) - Total budget in minor units
- `budget_currency` (char(3)) - Currency code
- `spent_amount` (unsigned big integer, default 0) - Amount spent so far
- `pricing_model` (enum: cpm, cpc, cpa, flat) - Cost per M/click/action/flat
- `pricing_rate` (unsigned big integer) - Rate in minor units
- `targeting` (json, nullable) - Targeting criteria (roles, geo, etc.)
- `metadata` (json, nullable) - Additional metadata
- `approved_at` (datetime, nullable)
- `approved_by` (foreign key to users, nullable)
- `rejected_at` (datetime, nullable)
- `rejection_reason` (text, nullable)
- `created_at`, `updated_at`
- `deleted_at` (soft deletes)

#### `ad_creatives`
- `id` (primary key)
- `ad_id` (foreign key to ads)
- `placement` (enum: timeline_inline, dashboard_sidebar_small, dashboard_sidebar_large, dashboard_sidebar_medium)
- `size` (enum: small, medium, large, banner, square) - Visual size classification
- `asset_type` (enum: image, video, html) - Type of creative
- `asset_path` (string) - Path to uploaded asset
- `asset_url` (string, nullable) - External URL if not uploaded
- `headline` (string, nullable) - Ad headline
- `body_text` (text, nullable) - Ad body copy
- `cta_text` (string, nullable) - Call-to-action text
- `cta_url` (string) - Landing page URL
- `display_order` (unsigned integer, default 0) - For multiple creatives per ad
- `is_active` (boolean, default true)
- `review_status` (enum: pending, approved, rejected) - Moderation status
- `reviewed_at` (datetime, nullable)
- `reviewed_by` (foreign key to users, nullable)
- `metadata` (json, nullable)
- `created_at`, `updated_at`

#### `ad_campaigns`
- `id` (primary key)
- `uuid` (unique identifier)
- `advertiser_id` (foreign key to users)
- `name` (string)
- `status` (enum: draft, active, paused, completed, cancelled)
- `start_date` (datetime)
- `end_date` (datetime, nullable)
- `total_budget` (unsigned big integer)
- `currency` (char(3))
- `spent_amount` (unsigned big integer, default 0)
- `pacing_strategy` (enum: standard, accelerated, even) - How to distribute budget
- `metadata` (json, nullable)
- `created_at`, `updated_at`
- `deleted_at` (soft deletes)

#### `ad_placements`
- `id` (primary key)
- `key` (string, unique) - e.g., 'timeline_inline', 'dashboard_sidebar_large'
- `name` (string) - Human-readable name
- `description` (text, nullable)
- `allowed_sizes` (json) - Array of allowed size enums
- `default_weight` (unsigned integer, default 100) - Default selection weight
- `is_active` (boolean, default true)
- `metadata` (json, nullable)
- `created_at`, `updated_at`

#### `ad_impressions`
- `id` (primary key)
- `ad_id` (foreign key to ads)
- `ad_creative_id` (foreign key to ad_creatives)
- `placement` (string) - Where the ad was shown
- `user_id` (foreign key to users, nullable) - Viewer (nullable for anonymous)
- `session_id` (string, nullable) - Session identifier
- `ip_address` (string, nullable)
- `user_agent` (text, nullable)
- `referrer` (string, nullable)
- `viewed_at` (datetime) - When the impression occurred
- `metadata` (json, nullable) - Additional context
- `created_at` (indexed for reporting)

Indexes:
- `ad_id`, `viewed_at`
- `user_id`, `viewed_at`
- `placement`, `viewed_at`

#### `ad_clicks`
- `id` (primary key)
- `ad_id` (foreign key to ads)
- `ad_creative_id` (foreign key to ad_creatives)
- `impression_id` (foreign key to ad_impressions, nullable) - Link to original impression
- `placement` (string)
- `user_id` (foreign key to users, nullable)
- `session_id` (string, nullable)
- `ip_address` (string, nullable)
- `user_agent` (text, nullable)
- `clicked_at` (datetime)
- `metadata` (json, nullable)
- `created_at` (indexed for reporting)

Indexes:
- `ad_id`, `clicked_at`
- `user_id`, `clicked_at`
- `impression_id`

#### `ad_reports`
- `id` (primary key)
- `ad_id` (foreign key to ads, nullable) - Nullable for aggregate reports
- `campaign_id` (foreign key to ad_campaigns, nullable)
- `placement` (string, nullable)
- `report_date` (date) - Date the report covers
- `report_type` (enum: daily, weekly, monthly, custom) - Aggregation level
- `impressions` (unsigned big integer, default 0)
- `clicks` (unsigned big integer, default 0)
- `spend` (unsigned big integer, default 0) - Amount spent
- `ctr` (decimal 5,4) - Click-through rate
- `cpm` (unsigned big integer, nullable) - Cost per thousand impressions
- `cpc` (unsigned big integer, nullable) - Cost per click
- `metadata` (json, nullable) - Additional metrics
- `generated_at` (datetime)
- `created_at`, `updated_at`

Indexes:
- `ad_id`, `report_date`
- `campaign_id`, `report_date`
- `report_date`

## Enums

### AdStatus
- `draft`
- `pending_review`
- `active`
- `paused`
- `expired`
- `rejected`

### AdPlacement
- `timeline_inline` - In the main timeline feed
- `dashboard_sidebar_small` - Small sidebar ad
- `dashboard_sidebar_medium` - Medium sidebar ad
- `dashboard_sidebar_large` - Large sidebar ad

### AdSize
- `small` - 300x250 (rectangle)
- `medium` - 300x600 (skyscraper)
- `large` - 728x90 (banner)
- `banner` - 970x250 (large banner)
- `square` - 250x250 (square)

### PricingModel
- `cpm` - Cost per thousand impressions
- `cpc` - Cost per click
- `cpa` - Cost per action (conversion)
- `flat` - Flat rate (fixed price)

### CreativeAssetType
- `image` - Static image
- `video` - Video creative
- `html` - HTML/rich media

### CampaignStatus
- `draft`
- `active`
- `paused`
- `completed`
- `cancelled`

### PacingStrategy
- `standard` - Normal distribution
- `accelerated` - Spend faster early
- `even` - Even distribution over time

## Models & Relationships

### Ad Model
```php
// Relationships
- belongsTo(User::class, 'advertiser_id') // advertiser
- belongsTo(AdCampaign::class, 'campaign_id') // campaign (nullable)
- belongsTo(User::class, 'approved_by') // approver (nullable)
- hasMany(AdCreative::class) // creatives
- hasMany(AdImpression::class) // impressions
- hasMany(AdClick::class) // clicks
- hasMany(AdReport::class) // reports

// Scopes
- scopeActive() - Active ads
- scopeForPlacement($placement) - Ads for specific placement
- scopeEligible() - Ads that can be served (active, within date range, under caps)
- scopeForViewer($user) - Ads matching targeting for user
```

### AdCreative Model
```php
// Relationships
- belongsTo(Ad::class) // parent ad
- belongsTo(User::class, 'reviewed_by') // reviewer (nullable)
- hasMany(AdImpression::class) // impressions
- hasMany(AdClick::class) // clicks
```

### AdCampaign Model
```php
// Relationships
- belongsTo(User::class, 'advertiser_id') // advertiser
- hasMany(Ad::class) // ads in campaign
- hasMany(AdReport::class) // reports
```

## Services

### AdServingService
Responsible for selecting and serving ads based on:
- Placement requirements
- Targeting criteria
- Budget/cap constraints
- Weighted random selection
- Pacing controls

Key methods:
- `serve(AdPlacement $placement, ?User $viewer = null, array $context = []): ?AdCreative`
- `recordImpression(AdCreative $creative, AdPlacement $placement, ?User $viewer = null, array $context = []): AdImpression`
- `recordClick(AdCreative $creative, AdPlacement $placement, ?User $viewer = null, array $context = []): AdClick`
- `isEligible(Ad $ad, ?User $viewer = null): bool` - Check if ad can be shown

### AdReportingService
Handles report generation and analytics:
- `generateDailyReport(Carbon $date): void` - Generate daily reports
- `getAdReport(Ad $ad, Carbon $startDate, Carbon $endDate): array` - Get report for ad
- `getCampaignReport(AdCampaign $campaign, Carbon $startDate, Carbon $endDate): array` - Campaign report
- `getPlacementReport(AdPlacement $placement, Carbon $startDate, Carbon $endDate): array` - Placement report
- `calculateMetrics(Ad $ad, Carbon $startDate, Carbon $endDate): array` - Calculate CTR, CPM, CPC, etc.

### AdPricingService
Handles pricing calculations and budget management:
- `calculateCost(Ad $ad, int $impressions, int $clicks): int` - Calculate cost
- `checkBudget(Ad $ad): bool` - Check if ad has budget remaining
- `updateSpend(Ad $ad, int $amount): void` - Update spent amount
- `getEstimatedReach(Ad $ad, int $budget): int` - Estimate reach for budget

## Controllers

### AdController (API)
- `GET /api/ads/{placement}` - Serve ad for placement
- `POST /api/ads/{ad}/impressions` - Record impression
- `POST /api/ads/{ad}/clicks` - Record click
- `GET /api/ads/{ad}/track` - Track click and redirect (for click tracking)

### AdAdminController
- `GET /admin/ads` - List all ads (with filters)
- `GET /admin/ads/create` - Show create form
- `POST /admin/ads` - Store new ad
- `GET /admin/ads/{ad}` - Show ad details
- `GET /admin/ads/{ad}/edit` - Show edit form
- `PUT /admin/ads/{ad}` - Update ad
- `DELETE /admin/ads/{ad}` - Delete ad
- `POST /admin/ads/{ad}/approve` - Approve ad
- `POST /admin/ads/{ad}/reject` - Reject ad
- `POST /admin/ads/{ad}/pause` - Pause ad
- `POST /admin/ads/{ad}/resume` - Resume ad

### CampaignAdminController
- `GET /admin/campaigns` - List campaigns
- `GET /admin/campaigns/create` - Create campaign
- `POST /admin/campaigns` - Store campaign
- `GET /admin/campaigns/{campaign}` - Show campaign
- `GET /admin/campaigns/{campaign}/edit` - Edit campaign
- `PUT /admin/campaigns/{campaign}` - Update campaign
- `DELETE /admin/campaigns/{campaign}` - Delete campaign

### ReportAdminController
- `GET /admin/reports` - List reports
- `GET /admin/reports/{ad}` - Show ad report
- `GET /admin/reports/campaign/{campaign}` - Show campaign report
- `GET /admin/reports/export` - Export reports (CSV)

### AdvertiserController (Self-Serve)
- `GET /advertiser/ads` - Advertiser's ads
- `GET /advertiser/ads/create` - Create ad
- `POST /advertiser/ads` - Store ad
- `GET /advertiser/ads/{ad}` - View ad
- `GET /advertiser/ads/{ad}/edit` - Edit ad
- `PUT /advertiser/ads/{ad}` - Update ad
- `GET /advertiser/ads/{ad}/report` - View report
- `GET /advertiser/campaigns` - Advertiser's campaigns
- `POST /advertiser/checkout` - Checkout for ad purchase

## Frontend Components

### Timeline Ad Integration
- Inject ads every N posts (e.g., every 5-7 posts)
- Use deferred props or lazy loading for performance
- Match styling with timeline entries

### SidebarAd Component
- React component for dashboard sidebar
- Supports different sizes (small, medium, large)
- Lazy load with `WhenVisible` or deferred props
- Responsive design

### Admin Pages (Inertia React)
- `Admin/Ads/Index.tsx` - List ads with filters, search, bulk actions
- `Admin/Ads/Create.tsx` - Multi-step form (campaign → targeting → creatives)
- `Admin/Ads/Edit.tsx` - Edit ad
- `Admin/Ads/Show.tsx` - View ad details with live metrics
- `Admin/Campaigns/Index.tsx` - List campaigns
- `Admin/Campaigns/Create.tsx` - Create campaign
- `Admin/Reports/Show.tsx` - Report dashboard with charts

### Advertiser Pages
- `Advertiser/Ads/Index.tsx` - Advertiser's ads
- `Advertiser/Ads/Create.tsx` - Create ad (self-serve)
- `Advertiser/Checkout.tsx` - Checkout flow
- `Advertiser/Reports/Show.tsx` - Advertiser reports

## Background Jobs

### LogAdImpression Job
- Queue: `default` or `ads`
- Records impression asynchronously
- Updates daily counters
- Checks caps and pauses ads if needed

### LogAdClick Job
- Queue: `default` or `ads`
- Records click asynchronously
- Updates daily counters
- Calculates cost and updates spend

### GenerateAdReport Job
- Queue: `default` or `reports`
- Generates daily/weekly/monthly reports
- Aggregates impressions, clicks, spend
- Calculates metrics (CTR, CPM, CPC)

## Scheduled Tasks

Add to `routes/console.php`:
```php
Schedule::job(new GenerateAdReport(Carbon::yesterday()))
    ->daily()
    ->at('02:00')
    ->onOneServer();
```

## Integration Points

### Timeline Feed Integration
Modify `FeedService::getFollowingFeed()` to inject ads:
1. Fetch timeline entries as normal
2. Every N entries, insert an ad entry
3. Use `AdServingService` to select appropriate ad
4. Return mixed array of timeline entries and ad entries

### Dashboard Sidebar Integration
Modify `DashboardController` to include sidebar ad via deferred prop:
```php
return Inertia::render('Dashboard/Index', [
    // ... existing props
])->with([
    'sidebarAd' => Inertia::defer(fn () => $this->adServingService->serve(AdPlacement::DashboardSidebarLarge, $user)),
]);
```

### Payment Integration
- Use existing `PaymentService` for ad purchases
- Create `AdPurchase` model similar to `PostPurchase`
- Link payments to ads via `payable` morph relationship
- Auto-activate ads when payment is captured

## Policies

### AdPolicy
- `viewAny` - Admin only
- `view` - Admin or advertiser (own ads)
- `create` - Authenticated users (for self-serve) or admin
- `update` - Admin or advertiser (own ads, if draft/pending)
- `delete` - Admin or advertiser (own ads, if not active)
- `approve` - Admin only
- `reject` - Admin only

## Testing Strategy

### Feature Tests
- `AdServingTest` - Test ad selection logic
- `AdReportingTest` - Test report generation
- `AdAdminTest` - Test admin CRUD operations
- `AdvertiserTest` - Test self-serve functionality
- `AdIntegrationTest` - Test timeline and sidebar integration

### Unit Tests
- `AdServingServiceTest` - Test serving logic
- `AdReportingServiceTest` - Test report calculations
- `AdPricingServiceTest` - Test pricing calculations

### Browser Tests (Pest)
- Test ad display in timeline
- Test sidebar ad rendering
- Test click tracking
- Test admin interface workflows

## Configuration

### `config/ads.php`
```php
return [
    'placements' => [
        'timeline_inline' => [
            'name' => 'Timeline Inline',
            'allowed_sizes' => [AdSize::Small, AdSize::Medium],
            'default_weight' => 100,
            'injection_interval' => 6, // Every 6 posts
        ],
        'dashboard_sidebar_large' => [
            'name' => 'Dashboard Sidebar Large',
            'allowed_sizes' => [AdSize::Large, AdSize::Banner],
            'default_weight' => 100,
        ],
        // ... more placements
    ],
    
    'pricing' => [
        'default_cpm' => 500, // $5.00 per 1000 impressions
        'default_cpc' => 50, // $0.50 per click
    ],
    
    'caps' => [
        'max_daily_impressions_per_user' => 10,
        'max_daily_clicks_per_user' => 3,
    ],
];
```

## Routes

### API Routes (`routes/api.php`)
```php
Route::prefix('ads')->group(function () {
    Route::get('/{placement}', [AdController::class, 'serve']);
    Route::post('/{ad}/impressions', [AdController::class, 'recordImpression']);
    Route::post('/{ad}/clicks', [AdController::class, 'recordClick']);
    Route::get('/{ad}/track', [AdController::class, 'trackClick']);
});
```

### Admin Routes (`routes/web.php`)
```php
Route::middleware(['auth', 'can:viewAny,App\Models\Ad'])->prefix('admin')->group(function () {
    Route::resource('ads', AdAdminController::class);
    Route::post('ads/{ad}/approve', [AdAdminController::class, 'approve']);
    Route::post('ads/{ad}/reject', [AdAdminController::class, 'reject']);
    Route::post('ads/{ad}/pause', [AdAdminController::class, 'pause']);
    Route::post('ads/{ad}/resume', [AdAdminController::class, 'resume']);
    
    Route::resource('campaigns', CampaignAdminController::class);
    
    Route::get('reports', [ReportAdminController::class, 'index']);
    Route::get('reports/{ad}', [ReportAdminController::class, 'show']);
    Route::get('reports/campaign/{campaign}', [ReportAdminController::class, 'campaignReport']);
});
```

### Advertiser Routes (`routes/web.php`)
```php
Route::middleware('auth')->prefix('advertiser')->group(function () {
    Route::resource('ads', AdvertiserController::class)->only(['index', 'create', 'store', 'show', 'edit', 'update']);
    Route::get('ads/{ad}/report', [AdvertiserController::class, 'report']);
    Route::get('campaigns', [AdvertiserController::class, 'campaigns']);
    Route::post('checkout', [AdvertiserController::class, 'checkout']);
});
```

## Next Steps

1. Create migrations for all tables
2. Create Enums
3. Create Models with relationships
4. Create Factories and Seeders
5. Create Services (AdServingService, AdReportingService, AdPricingService)
6. Create Controllers
7. Create Form Requests
8. Create API Resources
9. Create Policies
10. Create Frontend Components
11. Integrate into Timeline and Dashboard
12. Create Background Jobs
13. Add Scheduled Tasks
14. Write Tests
15. Add Routes





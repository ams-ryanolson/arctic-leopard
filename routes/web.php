<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\Ads\AdAdminController;
use App\Http\Controllers\Admin\Ads\CampaignAdminController;
use App\Http\Controllers\Admin\Ads\ReportAdminController;
use App\Http\Controllers\Admin\CircleAdminController;
use App\Http\Controllers\Advertiser\AdvertiserController;
use App\Http\Controllers\Auth\EmailAvailabilityController;
use App\Http\Controllers\Auth\UsernameAvailabilityController;
use App\Http\Controllers\Bookmarks\BookmarkController;
use App\Http\Controllers\Circles\CircleController;
use App\Http\Controllers\Circles\CircleMembershipController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Events\EventAdminController;
use App\Http\Controllers\Events\EventController;
use App\Http\Controllers\Events\EventRsvpController;
use App\Http\Controllers\Hashtags\HashtagController;
use App\Http\Controllers\LegalPageController;
use App\Http\Controllers\Notifications\NotificationController;
use App\Http\Controllers\Onboarding\CreatorSetupController;
use App\Http\Controllers\Onboarding\FinishOnboardingController;
use App\Http\Controllers\Onboarding\FollowSuggestionsController;
use App\Http\Controllers\Onboarding\MediaController;
use App\Http\Controllers\Onboarding\OnboardingController;
use App\Http\Controllers\Onboarding\ProfileBasicsController;
use App\Http\Controllers\Posts\PostAnalyticsController;
use App\Http\Controllers\Posts\PostBookmarkController;
use App\Http\Controllers\Posts\PostComposerController;
use App\Http\Controllers\Profile\UpdateCoordinatesController;
use App\Http\Controllers\Profile\UpdateTravelBeaconController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProfileFollowersController;
use App\Http\Controllers\Radar\BoostController;
use App\Http\Controllers\RadarController;
use App\Http\Controllers\Search\SearchController;
use App\Http\Controllers\Signals\SignalsAudienceController;
use App\Http\Controllers\Signals\SignalsComplianceController;
use App\Http\Controllers\Signals\SignalsMonetizationController;
use App\Http\Controllers\Signals\SignalsOverviewController;
use App\Http\Controllers\Signals\SignalsPayoutsController;
use App\Http\Controllers\Signals\SignalsPlaybooksController;
use App\Http\Controllers\Signals\SignalsSettingsController;
use App\Http\Controllers\Signals\SignalsSetupController;
use App\Http\Controllers\Signals\SignalsStatsController;
use App\Http\Controllers\Signals\SignalsSubscriptionsController;
use App\Http\Controllers\Stories\StoryController;
use App\Http\Controllers\Stories\StoryReactionController;
use App\Http\Controllers\Toasts\AcknowledgeToastController;
use App\Http\Controllers\Toasts\ResolveToastActionController;
use App\Http\Controllers\Uploads\TemporaryUploadController;
use App\Http\Controllers\UserBlockController;
use App\Http\Controllers\UserFollowController;
use App\Http\Controllers\UserFollowRequestController;
use App\Models\Event;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::middleware('guest')->group(function () {
    Route::get('/', function () {
        return Inertia::render('welcome', [
            'canRegister' => Features::enabled(Features::registration()),
        ]);
    })->name('home');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('uploads/tmp', [TemporaryUploadController::class, 'store'])->name('uploads.tmp.store');
    Route::delete('uploads/tmp', [TemporaryUploadController::class, 'destroy'])->name('uploads.tmp.destroy');
    Route::get('uploads/tmp/{upload}', [TemporaryUploadController::class, 'show'])->name('uploads.tmp.show');

    Route::prefix('toasts')->as('toasts.')->group(function () {
        Route::post('{toast}/acknowledge', AcknowledgeToastController::class)->name('acknowledge');
        Route::post('{toast}/action', ResolveToastActionController::class)->name('action');
    });

    Route::get('onboarding', OnboardingController::class)->name('onboarding.start');
    Route::get('onboarding/profile-basics', [ProfileBasicsController::class, 'show'])->name('onboarding.profile');
    Route::put('onboarding/profile-basics', [ProfileBasicsController::class, 'update'])->name('onboarding.profile.update');
    Route::get('onboarding/media', [MediaController::class, 'show'])->name('onboarding.media');
    Route::put('onboarding/media', [MediaController::class, 'update'])->name('onboarding.media.update');
    Route::get('onboarding/follow-suggestions', FollowSuggestionsController::class)->name('onboarding.follow');
    Route::get('onboarding/creator-tools', CreatorSetupController::class)->name('onboarding.creator');
    Route::post('onboarding/finish', FinishOnboardingController::class)->name('onboarding.finish');

    Route::middleware('profile.completed')->group(function () {
        $profileDemoData = static fn (): array => [
            'display_name' => 'Dante Knox',
            'handle' => '@danteknox',
            'location' => 'Los Angeles, CA',
            'pronouns' => 'He/Him',
            'role' => 'Rigger · Sensory Dom · Performance Artist',
            'cover_image' => 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1500&q=80',
            'avatar_url' => 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
            'bio' => 'International rope artist blending breath play, suspension, and immersive sensory design. Founder of the Silver Collar circle and touring instructor focused on consent choreography.',
            'badges' => ['Verified Creator', 'Consent Certified', 'Traveler Mode Enabled'],
            'tags' => ['#ropephoria', '#breathplay', '#aftercareaudio', '#leathernights', '#waxalchemy'],
            'stats' => [
                ['label' => 'Followers', 'value' => '48.6K'],
                ['label' => 'Circles', 'value' => '12'],
                ['label' => 'Active Subscribers', 'value' => '3,482'],
                ['label' => 'Monthly Tips', 'value' => '$18.4K'],
            ],
            'availability' => [
                'status' => 'Accepting IRL Collaborations',
                'window' => 'West Coast · Jan - Mar 2026',
                'note' => 'DM with references. Remote consults available weekly.',
            ],
            'subscription_tiers' => [
                [
                    'name' => 'Backstage Access',
                    'price' => '$12/mo',
                    'description' => 'Weekly photo drops, rehearsal notes, and scene polls.',
                    'perks' => [
                        '3 premium drops per week',
                        'Access to public circle rooms',
                        'Voting power on upcoming rituals',
                    ],
                ],
                [
                    'name' => 'Dungeon Keyholder',
                    'price' => '$28/mo',
                    'description' => 'Full scene archives, behind-the-scenes livestreams, and aftercare guides.',
                    'perks' => [
                        'Full archive access',
                        'Monthly live Q&A with scene breakdowns',
                        'Circle-only chat and tip trains',
                    ],
                ],
                [
                    'name' => 'Edge Guardians',
                    'price' => '$65/mo',
                    'description' => '1:1 mentorship slots, custom scene briefs, and IRL priority scheduling.',
                    'perks' => [
                        'Quarterly mentorship intensives',
                        'Priority booking for private rituals',
                        'Collaborative scene planning board',
                    ],
                ],
            ],
            'tip_options' => [
                ['amount' => '$15', 'label' => 'Buy a shot of courage'],
                ['amount' => '$35', 'label' => 'Trigger the wax cascade'],
                ['amount' => '$80', 'label' => 'Sponsor a suspension'],
                ['amount' => '$150', 'label' => 'Full aftercare package'],
            ],
            'wishlist' => [
                [
                    'title' => 'Custom dyed jute rope set',
                    'price' => '$95',
                    'link' => '#',
                ],
                [
                    'title' => '4K low-light camera rig',
                    'price' => '$1,280',
                    'link' => '#',
                ],
                [
                    'title' => 'Travel fund - Berlin Leather Week',
                    'price' => '$540',
                    'link' => '#',
                ],
            ],
            'feed' => [
                [
                    'id' => 1,
                    'timestamp' => '2h ago',
                    'title' => 'New Drop: Iron & Rope Ritual',
                    'content' => '45 minutes of choreographed suspension with layered breath play and a dual-safeword system. Includes rigging diagrams and playlist links.',
                    'media' => [
                        'https://images.unsplash.com/photo-1503342452485-86b7f54527dd?auto=format&fit=crop&w=900&q=80',
                    ],
                ],
                [
                    'id' => 2,
                    'timestamp' => 'Yesterday',
                    'title' => 'Tip Train Unlocked',
                    'content' => 'We hit the Edge Guardians milestone in 11 minutes. Unlocking the bonus breath control workshop this Sunday.',
                    'media' => [],
                ],
                [
                    'id' => 3,
                    'timestamp' => '3 days ago',
                    'title' => 'Circle Spotlight: Silver Collar',
                    'content' => 'Our circle broke down aftercare analytics for hybrid scenes. Posting the templates for members tonight.',
                    'media' => [],
                ],
            ],
        ];

        Route::get('dashboard', DashboardController::class)->name('dashboard');
        Route::get('search', [SearchController::class, 'index'])->name('search.index');
        Route::post('posts', PostComposerController::class)->name('posts.store');
        Route::post('posts/{post}/bookmarks', [PostBookmarkController::class, 'store'])
            ->name('posts.bookmarks.store')
            ->can('bookmark', 'post');
        Route::delete('posts/{post}/bookmarks', [PostBookmarkController::class, 'destroy'])
            ->name('posts.bookmarks.destroy')
            ->can('bookmark', 'post');
        Route::get('posts/{post}/analytics', [PostAnalyticsController::class, 'show'])
            ->name('posts.analytics.show')
            ->can('viewAnalytics', 'post');

        Route::prefix('stories')->as('stories.')->middleware('feature:feature_stories_enabled')->group(function () {
            Route::get('/create', function () {
                return Inertia::render('Stories/Create', [
                    'audiences' => [
                        ['value' => 'public', 'label' => 'Public'],
                        ['value' => 'followers', 'label' => 'Followers'],
                        ['value' => 'subscribers', 'label' => 'Subscribers'],
                    ],
                ]);
            })->name('create');
            Route::get('/', [StoryController::class, 'index'])->name('index');
            Route::post('/', [StoryController::class, 'store'])->name('store');
            Route::get('{story}', [StoryController::class, 'show'])->name('show');
            Route::delete('{story}', [StoryController::class, 'destroy'])->name('destroy');
            Route::post('{story}/view', [StoryController::class, 'markAsViewed'])->name('view');
            Route::get('{story}/analytics', [StoryController::class, 'analytics'])->name('analytics');

            Route::post('{story}/reactions', [StoryReactionController::class, 'store'])->name('reactions.store');
            Route::delete('{story}/reactions/{reaction}', [StoryReactionController::class, 'destroy'])->name('reactions.destroy');
        });

        Route::prefix('circles')->as('circles.')->middleware('feature:feature_circles_enabled')->group(function () {
            Route::get('/', [CircleController::class, 'index'])->name('index');
            Route::post('suggest', [CircleController::class, 'suggest'])->name('suggest');
            Route::get('{circle:slug}', [CircleController::class, 'show'])->name('show');
            Route::post('{circle:slug}/join', [CircleMembershipController::class, 'store'])->name('join');
            Route::delete('{circle:slug}/leave', [CircleMembershipController::class, 'destroy'])->name('leave');
        });

        Route::prefix('hashtags')->as('hashtags.')->group(function () {
            Route::get('/', [HashtagController::class, 'index'])->name('index');
            Route::get('{hashtag:slug}', [HashtagController::class, 'show'])->name('show');
        });

        Route::prefix('signals')->as('signals.')->middleware('feature:feature_signals_enabled')->group(function () {
            Route::get('setup', SignalsSetupController::class)->name('setup');
            Route::get('playbooks', [SignalsPlaybooksController::class, 'index'])->name('playbooks.index');
            Route::get('playbooks/{slug}', [SignalsPlaybooksController::class, 'show'])->name('playbooks.show');
            Route::get('/', SignalsOverviewController::class)->name('overview');
            Route::get('stats', SignalsStatsController::class)->name('stats');
            Route::get('subscriptions', SignalsSubscriptionsController::class)->name('subscriptions');
            Route::get('monetization', SignalsMonetizationController::class)->name('monetization');
            Route::get('payouts', SignalsPayoutsController::class)->name('payouts');
            Route::get('audience', SignalsAudienceController::class)->name('audience');
            Route::get('compliance', SignalsComplianceController::class)->name('compliance');
            Route::get('settings', SignalsSettingsController::class)->name('settings');

            Route::prefix('ads')->as('ads.')->group(function () {
                Route::get('/', [AdvertiserController::class, 'index'])
                    ->name('index');
                Route::get('create', [AdvertiserController::class, 'create'])
                    ->name('create');
                Route::post('/', [AdvertiserController::class, 'store'])
                    ->name('store');
                Route::get('{ad}', [AdvertiserController::class, 'show'])
                    ->name('show')
                    ->can('view', 'ad');
                Route::get('{ad}/edit', [AdvertiserController::class, 'edit'])
                    ->name('edit')
                    ->can('update', 'ad');
                Route::put('{ad}', [AdvertiserController::class, 'update'])
                    ->name('update')
                    ->can('update', 'ad');
                Route::get('{ad}/report', [AdvertiserController::class, 'report'])
                    ->name('report')
                    ->can('view', 'ad');
            });

            Route::get('ads/campaigns', [AdvertiserController::class, 'campaigns'])
                ->name('ads.campaigns.index');
            Route::post('ads/checkout', [AdvertiserController::class, 'checkout'])
                ->name('ads.checkout');

            Route::prefix('wishlist')->as('wishlist.')->middleware('feature:feature_wishlist_enabled')->group(function () {
                Route::get('/', [\App\Http\Controllers\Signals\SignalsWishlistController::class, 'index'])->name('index');
                Route::post('/', [\App\Http\Controllers\Signals\SignalsWishlistController::class, 'store'])->name('store');
                Route::put('{wishlistItem}', [\App\Http\Controllers\Signals\SignalsWishlistController::class, 'update'])->name('update');
                Route::delete('{wishlistItem}', [\App\Http\Controllers\Signals\SignalsWishlistController::class, 'destroy'])->name('destroy');
                Route::post('{wishlistItem}/renew', [\App\Http\Controllers\Signals\SignalsWishlistController::class, 'renew'])->name('renew');
                Route::get('{wishlistItem}/contributors', [\App\Http\Controllers\Signals\SignalsWishlistController::class, 'contributors'])->name('contributors');
                Route::get('{wishlistItem}/analytics', [\App\Http\Controllers\Signals\SignalsWishlistController::class, 'analytics'])->name('analytics');
            });
        });

        Route::get('upgrade', [\App\Http\Controllers\Memberships\MembershipController::class, 'index'])
            ->name('upgrade');
        Route::get('memberships/checkout/{plan}', [\App\Http\Controllers\Memberships\MembershipController::class, 'checkout'])
            ->name('memberships.checkout');

        Route::prefix('memberships')->as('memberships.')->group(function () {
            Route::post('purchase', [\App\Http\Controllers\Memberships\MembershipController::class, 'purchase'])
                ->name('purchase');
            Route::post('{membership}/upgrade', [\App\Http\Controllers\Memberships\MembershipController::class, 'upgrade'])
                ->name('upgrade');
            Route::post('{membership}/cancel', [\App\Http\Controllers\Memberships\MembershipController::class, 'cancel'])
                ->name('cancel');
            Route::post('apply-discount', [\App\Http\Controllers\Memberships\MembershipController::class, 'applyDiscount'])
                ->name('apply-discount');
        });

        Route::prefix('events')->as('events.')->middleware('feature:feature_events_enabled')->group(function () {
            Route::get('/', [EventController::class, 'index'])->name('index');
            Route::get('submit', [EventController::class, 'submit'])->name('submit');
            Route::post('/', [EventController::class, 'store'])->name('store');
            Route::get('{event:slug}', [EventController::class, 'show'])->name('show');
            Route::post('{event:slug}/rsvp', [EventRsvpController::class, 'store'])->name('rsvps.store');
            Route::delete('{event:slug}/rsvp', [EventRsvpController::class, 'destroy'])->name('rsvps.destroy');
        });

        Route::prefix('admin')
            ->as('admin.')
            ->middleware('role_or_permission:Admin|Super Admin')
            ->group(function () {
                Route::get('/', AdminDashboardController::class)
                    ->name('dashboard')
                    ->can('accessAdmin', User::class);

                Route::prefix('users')->as('users.')->group(function () {
                    Route::get('/', [AdminUserController::class, 'index'])
                        ->name('index')
                        ->can('viewAny', User::class);
                    Route::get('/suspensions', [AdminUserController::class, 'suspensions'])
                        ->name('suspensions')
                        ->can('viewAny', User::class);
                    Route::patch('{user}/roles', [AdminUserController::class, 'update'])
                        ->name('roles.update')
                        ->can('updateRoles', 'user');
                    Route::post('{user}/require-reverification', [\App\Http\Controllers\Admin\AdminVerificationController::class, 'requireReverification'])
                        ->name('require-reverification')
                        ->can('manageUsers', User::class);
                    Route::post('{user}/suspend', [AdminUserController::class, 'suspend'])
                        ->name('suspend')
                        ->can('suspend', 'user');
                    Route::post('{user}/unsuspend', [AdminUserController::class, 'unsuspend'])
                        ->name('unsuspend')
                        ->can('unsuspend', 'user');
                    Route::post('{user}/ban', [AdminUserController::class, 'ban'])
                        ->name('ban')
                        ->can('ban', 'user');
                    Route::post('{user}/unban', [AdminUserController::class, 'unban'])
                        ->name('unban')
                        ->can('unban', 'user');
                    Route::post('{user}/warn', [AdminUserController::class, 'warn'])
                        ->name('warn')
                        ->can('warn', 'user');
                    Route::post('{user}/grant-free-membership', [AdminUserController::class, 'grantFreeMembership'])
                        ->name('grant-free-membership')
                        ->can('grantFreeMembership', 'user');
                });

                Route::prefix('settings')->as('settings.')->group(function () {
                    Route::get('/', [\App\Http\Controllers\Admin\AdminSettingsController::class, 'index'])
                        ->name('index');
                    Route::patch('{key}', [\App\Http\Controllers\Admin\AdminSettingsController::class, 'update'])
                        ->name('update');
                    Route::patch('/', [\App\Http\Controllers\Admin\AdminSettingsController::class, 'updateMany'])
                        ->name('update-many');
                    Route::post('branding/upload', [\App\Http\Controllers\Admin\AdminSettingsController::class, 'uploadBranding'])
                        ->name('branding.upload');
                });

                Route::prefix('roles')->as('roles.')->group(function () {
                    Route::get('/', [\App\Http\Controllers\Admin\AdminRolesController::class, 'index'])
                        ->name('index')
                        ->can('manage roles');
                    Route::patch('{role}', [\App\Http\Controllers\Admin\AdminRolesController::class, 'update'])
                        ->name('update')
                        ->can('manage roles');
                });

                Route::prefix('activity-log')->as('activity-log.')->group(function () {
                    Route::get('/', [\App\Http\Controllers\Admin\AdminActivityLogController::class, 'index'])
                        ->name('index')
                        ->can('accessAdmin', User::class);
                });

                Route::prefix('memberships')->as('memberships.')->group(function () {
                    Route::get('/', [\App\Http\Controllers\Admin\AdminMembershipController::class, 'index'])
                        ->name('index')
                        ->can('manage settings');
                    Route::get('create', [\App\Http\Controllers\Admin\AdminMembershipController::class, 'create'])
                        ->name('create')
                        ->can('manage settings');
                    Route::post('/', [\App\Http\Controllers\Admin\AdminMembershipController::class, 'store'])
                        ->name('store')
                        ->can('manage settings');
                    Route::get('{plan}/edit', [\App\Http\Controllers\Admin\AdminMembershipController::class, 'edit'])
                        ->name('edit')
                        ->can('manage settings');
                    Route::patch('{plan}', [\App\Http\Controllers\Admin\AdminMembershipController::class, 'update'])
                        ->name('update')
                        ->can('manage settings');
                    Route::delete('{plan}', [\App\Http\Controllers\Admin\AdminMembershipController::class, 'destroy'])
                        ->name('destroy')
                        ->can('manage settings');
                    Route::get('users', [\App\Http\Controllers\Admin\AdminMembershipController::class, 'userMemberships'])
                        ->name('users.index')
                        ->can('manage settings');
                    Route::get('users/{user}', [\App\Http\Controllers\Admin\AdminMembershipController::class, 'showUserMembership'])
                        ->name('users.show')
                        ->can('manage settings');
                    Route::post('users/{user}/assign', [\App\Http\Controllers\Admin\AdminMembershipController::class, 'assignMembership'])
                        ->name('users.assign')
                        ->can('manage settings');
                    Route::prefix('discounts')->as('discounts.')->group(function () {
                        Route::get('/', [\App\Http\Controllers\Admin\AdminDiscountController::class, 'index'])
                            ->name('index')
                            ->can('manage settings');
                        Route::get('create', [\App\Http\Controllers\Admin\AdminDiscountController::class, 'create'])
                            ->name('create')
                            ->can('manage settings');
                        Route::post('/', [\App\Http\Controllers\Admin\AdminDiscountController::class, 'store'])
                            ->name('store')
                            ->can('manage settings');
                        Route::get('{discount}/edit', [\App\Http\Controllers\Admin\AdminDiscountController::class, 'edit'])
                            ->name('edit')
                            ->can('manage settings');
                        Route::patch('{discount}', [\App\Http\Controllers\Admin\AdminDiscountController::class, 'update'])
                            ->name('update')
                            ->can('manage settings');
                        Route::delete('{discount}', [\App\Http\Controllers\Admin\AdminDiscountController::class, 'destroy'])
                            ->name('destroy')
                            ->can('manage settings');
                    });
                });

                Route::prefix('events')->as('events.')->group(function () {
                    Route::get('/', [EventAdminController::class, 'index'])
                        ->name('index')
                        ->can('viewAny', Event::class);
                    Route::post('/', [EventAdminController::class, 'store'])
                        ->name('store')
                        ->can('create', Event::class);
                    Route::get('{event}', [EventAdminController::class, 'show'])
                        ->name('show')
                        ->can('view', 'event');
                    Route::put('{event}', [EventAdminController::class, 'update'])
                        ->name('update')
                        ->can('update', 'event');
                    Route::delete('{event}', [EventAdminController::class, 'destroy'])
                        ->name('destroy')
                        ->can('delete', 'event');
                    Route::post('{event}/approve', [EventAdminController::class, 'approve'])
                        ->name('approve')
                        ->can('approve', 'event');
                    Route::post('{event}/publish', [EventAdminController::class, 'publish'])
                        ->name('publish')
                        ->can('publish', 'event');
                    Route::post('{event}/cancel', [EventAdminController::class, 'cancel'])
                        ->name('cancel')
                        ->can('cancel', 'event');
                });

                Route::prefix('circles')->as('circles.')->group(function () {
                    Route::get('/', [CircleAdminController::class, 'index'])->name('index');
                    Route::get('suggestions/{suggestion:id}/review', [CircleAdminController::class, 'review'])->name('suggestions.review');
                    Route::post('suggestions/{suggestion:id}/create', [CircleAdminController::class, 'createFromSuggestion'])->name('suggestions.create');
                    Route::post('suggestions/{suggestion:id}/decline', [CircleAdminController::class, 'decline'])->name('suggestions.decline');
                });

                Route::prefix('ads')->as('ads.')->middleware('feature:feature_ads_enabled')->group(function () {
                    Route::get('/', [AdAdminController::class, 'index'])
                        ->name('index')
                        ->can('viewAny', \App\Models\Ads\Ad::class);
                    Route::get('create', [AdAdminController::class, 'create'])
                        ->name('create')
                        ->can('create', \App\Models\Ads\Ad::class);
                    Route::post('/', [AdAdminController::class, 'store'])
                        ->name('store')
                        ->can('create', \App\Models\Ads\Ad::class);
                    Route::get('{ad}', [AdAdminController::class, 'show'])
                        ->name('show')
                        ->can('view', 'ad');
                    Route::get('{ad}/edit', [AdAdminController::class, 'edit'])
                        ->name('edit')
                        ->can('update', 'ad');
                    Route::put('{ad}', [AdAdminController::class, 'update'])
                        ->name('update')
                        ->can('update', 'ad');
                    Route::delete('{ad}', [AdAdminController::class, 'destroy'])
                        ->name('destroy')
                        ->can('delete', 'ad');
                    Route::post('{ad}/approve', [AdAdminController::class, 'approve'])
                        ->name('approve')
                        ->can('approve', 'ad');
                    Route::post('{ad}/reject', [AdAdminController::class, 'reject'])
                        ->name('reject')
                        ->can('reject', 'ad');
                    Route::post('{ad}/pause', [AdAdminController::class, 'pause'])
                        ->name('pause')
                        ->can('pause', 'ad');
                    Route::post('{ad}/resume', [AdAdminController::class, 'resume'])
                        ->name('resume')
                        ->can('resume', 'ad');
                });

                Route::prefix('campaigns')->as('campaigns.')->group(function () {
                    Route::get('/', [CampaignAdminController::class, 'index'])
                        ->name('index')
                        ->can('viewAny', \App\Models\Ads\AdCampaign::class);
                    Route::get('create', [CampaignAdminController::class, 'create'])
                        ->name('create')
                        ->can('create', \App\Models\Ads\AdCampaign::class);
                    Route::post('/', [CampaignAdminController::class, 'store'])
                        ->name('store')
                        ->can('create', \App\Models\Ads\AdCampaign::class);
                    Route::get('{campaign}', [CampaignAdminController::class, 'show'])
                        ->name('show')
                        ->can('view', 'campaign');
                    Route::get('{campaign}/edit', [CampaignAdminController::class, 'edit'])
                        ->name('edit')
                        ->can('update', 'campaign');
                    Route::put('{campaign}', [CampaignAdminController::class, 'update'])
                        ->name('update')
                        ->can('update', 'campaign');
                    Route::delete('{campaign}', [CampaignAdminController::class, 'destroy'])
                        ->name('destroy')
                        ->can('delete', 'campaign');
                });

                Route::prefix('reports')->as('reports.')->group(function () {
                    Route::get('/', [ReportAdminController::class, 'index'])
                        ->name('index')
                        ->can('viewAny', \App\Models\Ads\Ad::class);
                    Route::get('{ad}', [ReportAdminController::class, 'show'])
                        ->name('show')
                        ->can('view', 'ad');
                    Route::get('campaign/{campaign}', [ReportAdminController::class, 'campaignReport'])
                        ->name('campaign')
                        ->can('view', 'campaign');
                    Route::get('export', [ReportAdminController::class, 'export'])
                        ->name('export')
                        ->can('viewAny', \App\Models\Ads\Ad::class);
                });

                Route::prefix('appeals')->as('appeals.')->group(function () {
                    Route::get('/', [\App\Http\Controllers\Admin\AdminAppealController::class, 'index'])
                        ->name('index')
                        ->can('reviewAppeals', User::class);
                    Route::get('{appeal}', [\App\Http\Controllers\Admin\AdminAppealController::class, 'show'])
                        ->name('show')
                        ->can('reviewAppeals', User::class);
                    Route::post('{appeal}/review', [\App\Http\Controllers\Admin\AdminAppealController::class, 'review'])
                        ->name('review')
                        ->can('reviewAppeals', User::class);
                });

                Route::prefix('moderation')->as('moderation.')->middleware('role_or_permission:Admin|Super Admin|Moderator')->group(function () {
                    Route::get('/', [\App\Http\Controllers\Admin\AdminModerationController::class, 'index'])
                        ->name('index');
                    Route::get('{type}/{id}', [\App\Http\Controllers\Admin\AdminModerationController::class, 'show'])
                        ->name('show');
                    Route::post('{type}/{id}/approve', [\App\Http\Controllers\Admin\AdminModerationController::class, 'approve'])
                        ->name('approve');
                    Route::post('{type}/{id}/reject', [\App\Http\Controllers\Admin\AdminModerationController::class, 'reject'])
                        ->name('reject');
                    Route::post('{type}/{id}/dismiss', [\App\Http\Controllers\Admin\AdminModerationController::class, 'dismiss'])
                        ->name('dismiss');
                    Route::post('bulk-approve', [\App\Http\Controllers\Admin\AdminModerationController::class, 'bulkApprove'])
                        ->name('bulk-approve');
                    Route::post('bulk-reject', [\App\Http\Controllers\Admin\AdminModerationController::class, 'bulkReject'])
                        ->name('bulk-reject');
                });
            });

        Route::prefix('account')->as('account.')->group(function () {
            Route::get('banned', [\App\Http\Controllers\AccountStatusController::class, 'banned'])->name('banned');
            Route::get('suspended', [\App\Http\Controllers\AccountStatusController::class, 'suspended'])->name('suspended');
        });

        Route::prefix('account/appeal')->as('account.appeal.')->group(function () {
            Route::get('create', [\App\Http\Controllers\UserAppealController::class, 'create'])->name('create');
            Route::post('/', [\App\Http\Controllers\UserAppealController::class, 'store'])->name('store');
            Route::get('{appeal}', [\App\Http\Controllers\UserAppealController::class, 'show'])->name('show');
        });

        Route::get('radar', RadarController::class)->middleware('feature:feature_radar_enabled')->name('radar');
        Route::post('radar/boost', [BoostController::class, 'store'])->middleware('feature:feature_radar_enabled')->name('radar.boost.store');
        Route::patch('profile/location', UpdateCoordinatesController::class)->name('profile.location.update');
        Route::patch('profile/travel-beacon', UpdateTravelBeaconController::class)->name('profile.travel-beacon.update');
        Route::get('bookmarks', [BookmarkController::class, 'index'])->middleware('feature:feature_bookmarks_enabled')->name('bookmarks.index');
        Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
        Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllRead'])->name('notifications.mark-all-read');
        Route::patch('notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.mark-read');
        Route::delete('notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
        Route::delete('notifications', [NotificationController::class, 'destroyAll'])->name('notifications.destroy-all');

        Route::get('messages', \App\Http\Controllers\Messaging\InboxController::class)->middleware('feature:feature_messaging_enabled')->name('messages.index');
        Route::get('messages/{conversation:ulid?}', \App\Http\Controllers\Messaging\InboxController::class)
            ->middleware('feature:feature_messaging_enabled')
            ->where('conversation', '[A-Z0-9]+')
            ->name('messages.show');

        Route::get('profile-demo', function () use ($profileDemoData) {
            return Inertia::render('Profile/Demo', [
                'profile' => $profileDemoData(),
            ]);
        })->name('profile.demo');

        Route::get('profile-demo/wishlist', function () use ($profileDemoData) {
            return Inertia::render('Profile/Wishlist', [
                'profile' => $profileDemoData(),
            ]);
        })->name('profile.demo.wishlist');

        Route::post('users/{user}/block', [UserBlockController::class, 'store'])
            ->name('users.block.store');
        Route::delete('users/{user}/block', [UserBlockController::class, 'destroy'])
            ->name('users.block.destroy');
        Route::post('users/{user}/follow', [UserFollowController::class, 'store'])
            ->name('users.follow.store');
        Route::delete('users/{user}/follow', [UserFollowController::class, 'destroy'])
            ->name('users.follow.destroy');
        Route::post('users/{user}/follow-requests/{follower}/accept', [UserFollowRequestController::class, 'accept'])
            ->name('users.follow-requests.accept');
        Route::delete('users/{user}/follow-requests/{follower}', [UserFollowRequestController::class, 'destroy'])
            ->name('users.follow-requests.destroy');

    });
});

Route::get('p/{username}', [ProfileController::class, 'show'])
    ->name('profile.show');

Route::get('f/{username}', [ProfileFollowersController::class, 'show'])
    ->name('profile.followers');
Route::get('f/{username}/{tab}', [ProfileFollowersController::class, 'show'])
    ->name('profile.followers.tab')
    ->where('tab', 'followers|following|mutual');

Route::get('w/{username}', [\App\Http\Controllers\WishlistController::class, 'show'])
    ->middleware(['feature:feature_signals_enabled', 'feature:feature_wishlist_enabled'])
    ->name('wishlist.show');

Route::middleware(['auth', 'verified', 'feature:feature_signals_enabled', 'feature:feature_wishlist_enabled'])->group(function () {
    Route::get('wishlist/{wishlistItem}/checkout', [\App\Http\Controllers\WishlistCheckoutController::class, 'show'])->name('wishlist.checkout');
    Route::post('wishlist/{wishlistItem}/purchase', [\App\Http\Controllers\WishlistCheckoutController::class, 'store'])->name('wishlist.purchase');
    Route::get('wishlist/purchase/{purchase}/success', [\App\Http\Controllers\WishlistPurchaseController::class, 'success'])->name('wishlist.purchase.success');
    Route::get('wishlist/purchase/{purchase}/failure', [\App\Http\Controllers\WishlistPurchaseController::class, 'failure'])->name('wishlist.purchase.failure');
});

Route::get('username/check', UsernameAvailabilityController::class)->name('username.check');
Route::get('email/check', EmailAvailabilityController::class)->name('email.check');

require __DIR__.'/settings.php';

// Public legal pages
Route::prefix('legal')->group(function () {
    Route::get('/', [LegalPageController::class, 'index'])->name('legal.index');
    Route::get('/terms', [LegalPageController::class, 'show'])->defaults('page', 'terms')->name('legal.terms');
    Route::get('/privacy', [LegalPageController::class, 'show'])->defaults('page', 'privacy')->name('legal.privacy');
    Route::get('/guidelines', [LegalPageController::class, 'show'])->defaults('page', 'guidelines')->name('legal.guidelines');
    Route::get('/cookies', [LegalPageController::class, 'show'])->defaults('page', 'cookies')->name('legal.cookies');
    Route::get('/dmca', [LegalPageController::class, 'show'])->defaults('page', 'dmca')->name('legal.dmca');
});

<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\Ads\AdAdminController;
use App\Http\Controllers\Admin\Ads\CampaignAdminController;
use App\Http\Controllers\Admin\Ads\ReportAdminController;
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
use App\Http\Controllers\RadarController;
use App\Http\Controllers\Signals\SignalsAudienceController;
use App\Http\Controllers\Signals\SignalsComplianceController;
use App\Http\Controllers\Signals\SignalsMonetizationController;
use App\Http\Controllers\Signals\SignalsOverviewController;
use App\Http\Controllers\Signals\SignalsPayoutsController;
use App\Http\Controllers\Signals\SignalsSettingsController;
use App\Http\Controllers\Signals\SignalsStatsController;
use App\Http\Controllers\Signals\SignalsSubscriptionsController;
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

        Route::prefix('circles')->as('circles.')->group(function () {
            Route::get('/', [CircleController::class, 'index'])->name('index');
            Route::get('{circle:slug}', [CircleController::class, 'show'])->name('show');
            Route::post('{circle:slug}/join', [CircleMembershipController::class, 'store'])->name('join');
            Route::delete('{circle:slug}/leave', [CircleMembershipController::class, 'destroy'])->name('leave');
        });

        Route::prefix('signals')->as('signals.')->group(function () {
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
        });

        Route::get('upgrade', function () {
            return Inertia::render('Subscriptions/Upgrade', [
                'plans' => [
                    [
                        'id' => 'premium',
                        'name' => 'Premium',
                        'monthly' => 10,
                        'yearly' => 100,
                        'tagline' => 'Boost your feed with exclusive drops and scene recaps.',
                        'description' => 'Perfect for members who want full-resolution galleries, story unlocks, and weekly studio updates.',
                        'highlights' => [
                            '3 premium content drops every week',
                            'Priority access to live event replays',
                            'Unlocks backstage polls & feedback loops',
                            'Invite-only chat threads with creators',
                        ],
                    ],
                    [
                        'id' => 'elite',
                        'name' => 'Elite',
                        'monthly' => 20,
                        'yearly' => 200,
                        'tagline' => 'Edge deeper with live intensives, vault archives, and crew access.',
                        'description' => 'Go beyond standard drops with advanced workshops, circle rooms, and hands-on mentorship touchpoints.',
                        'highlights' => [
                            'Unlimited archive + premium vault unlocks',
                            'Monthly live intensives with Q&A',
                            'Circle-only rooms & ritual planning boards',
                            'Quarterly merch & kink kit drops',
                        ],
                        'badge' => 'Most popular',
                    ],
                    [
                        'id' => 'unlimited',
                        'name' => 'Unlimited',
                        'monthly' => 30,
                        'yearly' => 300,
                        'tagline' => 'Total access, concierge scheduling, and IRL priority lanes.',
                        'description' => 'Designed for producers, collectors, and power supporters who want concierge access, travel support, and direct collaboration.',
                        'highlights' => [
                            'Dedicated concierge with 24-hour response window',
                            'Priority booking for private and travel sessions',
                            'Custom content briefs & quarterly collaborations',
                            'Annual invite to in-person mastermind',
                        ],
                        'badge' => 'Founders circle',
                    ],
                ],
            ]);
        })->name('upgrade');

        Route::prefix('events')->as('events.')->group(function () {
            Route::get('/', [EventController::class, 'index'])->name('index');
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
                    Route::patch('{user}/roles', [AdminUserController::class, 'update'])
                        ->name('roles.update')
                        ->can('updateRoles', 'user');
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

                Route::prefix('ads')->as('ads.')->group(function () {
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
            });

        Route::get('radar', RadarController::class)->name('radar');
        Route::patch('profile/location', UpdateCoordinatesController::class)->name('profile.location.update');
        Route::patch('profile/travel-beacon', UpdateTravelBeaconController::class)->name('profile.travel-beacon.update');
        Route::get('bookmarks', [BookmarkController::class, 'index'])->name('bookmarks.index');
        Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
        Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllRead'])->name('notifications.mark-all-read');
        Route::patch('notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.mark-read');
        Route::delete('notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
        Route::delete('notifications', [NotificationController::class, 'destroyAll'])->name('notifications.destroy-all');

        Route::get('messages', \App\Http\Controllers\Messaging\InboxController::class)->name('messages.index');
        Route::get('messages/{conversation:ulid?}', \App\Http\Controllers\Messaging\InboxController::class)
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

Route::get('username/check', UsernameAvailabilityController::class)->name('username.check');
Route::get('email/check', EmailAvailabilityController::class)->name('email.check');

require __DIR__.'/settings.php';

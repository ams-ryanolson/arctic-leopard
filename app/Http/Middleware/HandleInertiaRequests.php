<?php

namespace App\Http\Middleware;

use App\Models\AdminSetting;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Services\Toasts\ToastBus;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Handle Inertia requests and disable SSR during tests.
     */
    public function rootView(Request $request): string
    {
        // Force disable SSR in testing environment to prevent hangs
        if (app()->environment('testing')) {
            config(['inertia.ssr.enabled' => false]);
        }

        return parent::rootView($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => AdminSetting::get('site_name', config('app.name')),
            'site' => [
                'name' => AdminSetting::get('site_name', config('app.name')),
                'logo' => [
                    'url' => (string) AdminSetting::get('site_logo_url', ''),
                    'url_2x' => (string) AdminSetting::get('site_logo_2x_url', ''),
                    'dark_url' => (string) AdminSetting::get('site_logo_dark_url', ''),
                    'dark_url_2x' => (string) AdminSetting::get('site_logo_dark_2x_url', ''),
                ],
            ],
            'legal' => [
                'age_of_consent_text' => (string) AdminSetting::get('age_of_consent_text', 'You must be 18 or older to use this site.'),
            ],
            'cookies' => [
                'banner' => [
                    'enabled' => (bool) AdminSetting::get('cookie_banner_enabled', true),
                    'message' => (string) AdminSetting::get('cookie_banner_message', 'We use cookies to personalize content, enhance your experience, and analyze our traffic.'),
                    'cta_label' => (string) AdminSetting::get('cookie_banner_cta_label', 'Accept all'),
                    'policy_url' => (string) AdminSetting::get('cookie_banner_policy_url', '/privacy'),
                ],
                'defaults' => [
                    'analytics' => (bool) AdminSetting::get('cookie_allow_analytics', false),
                    'marketing' => (bool) AdminSetting::get('cookie_allow_marketing', false),
                ],
                'services' => (array) AdminSetting::get('cookies_services', []),
                'do_not_sell_default' => (bool) AdminSetting::get('do_not_sell_default', false),
                'reprompt_days' => (int) AdminSetting::get('consent_reprompt_days', 180),
            ],
            'announcements' => [
                'announcement' => [
                    'enabled' => (bool) AdminSetting::get('global_announcement_enabled', false),
                    'level' => (string) AdminSetting::get('global_announcement_level', 'info'),
                    'message' => (string) AdminSetting::get('global_announcement_message', ''),
                    'dismissible' => (bool) AdminSetting::get('global_announcement_dismissible', true),
                    'start_at' => (string) AdminSetting::get('global_announcement_start_at', ''),
                    'end_at' => (string) AdminSetting::get('global_announcement_end_at', ''),
                ],
                'maintenance' => [
                    'enabled' => (bool) AdminSetting::get('maintenance_banner_enabled', false),
                    'message' => (string) AdminSetting::get('maintenance_banner_message', ''),
                    'cta_label' => (string) AdminSetting::get('maintenance_banner_cta_label', 'Learn more'),
                    'cta_url' => (string) AdminSetting::get('maintenance_banner_cta_url', ''),
                ],
                'emergency' => [
                    'enabled' => (bool) AdminSetting::get('emergency_interstitial_enabled', false),
                    'message' => (string) AdminSetting::get('emergency_interstitial_message', ''),
                ],
            ],
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user()
                    ? $request->user()->loadMissing('roles')
                    : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'toasts' => $request->user()
                ? fn (): array => app(ToastBus::class)->peek($request->user())
                : [],
            'notifications' => fn (): array => [
                'unread_count' => $request->user()
                    ? $request->user()->unreadNotifications()->count()
                    : 0,
            ],
            'messaging' => fn (): array => [
                'unread_count' => $request->user()
                    ? ConversationParticipant::query()
                        ->where('user_id', $request->user()->getKey())
                        ->whereNull('left_at')
                        ->get()
                        ->sum(function (ConversationParticipant $participant): int {
                            return Message::query()
                                ->where('conversation_id', $participant->conversation_id)
                                ->when(
                                    $participant->last_read_message_id,
                                    fn ($query) => $query->where('id', '>', $participant->last_read_message_id),
                                )
                                ->count();
                        })
                    : 0,
            ],
            'features' => [
                'blocking' => config('block.enabled'),
                'feature_ads_enabled' => (bool) AdminSetting::get('feature_ads_enabled', true),
                'feature_radar_enabled' => (bool) AdminSetting::get('feature_radar_enabled', true),
                'feature_signals_enabled' => (bool) AdminSetting::get('feature_signals_enabled', true),
                'feature_wishlist_enabled' => (bool) AdminSetting::get('feature_wishlist_enabled', true),
                'feature_video_chat_enabled' => (bool) AdminSetting::get('feature_video_chat_enabled', true),
                'feature_messaging_enabled' => (bool) AdminSetting::get('feature_messaging_enabled', true),
                'feature_events_enabled' => (bool) AdminSetting::get('feature_events_enabled', true),
                'feature_bookmarks_enabled' => (bool) AdminSetting::get('feature_bookmarks_enabled', true),
                'feature_beta_enabled' => (bool) AdminSetting::get('feature_beta_enabled', false),
            ],
        ];
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminSetting;
use App\Models\User;
use App\Services\FeatureFlagService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeatureFlagsController extends Controller
{
    /**
     * List of all available features with their metadata.
     */
    private const FEATURES = [
        'feature_ads_enabled' => [
            'name' => 'Ads',
            'description' => 'Enable house and network ad placements across the site.',
            'icon' => 'Megaphone',
        ],
        'feature_radar_enabled' => [
            'name' => 'Radar',
            'description' => 'Location-driven discovery and proximity features.',
            'icon' => 'Radar',
        ],
        'feature_signals_enabled' => [
            'name' => 'Signals',
            'description' => 'Creator tools for publishing, subscriptions, monetization, and audience growth.',
            'icon' => 'Sparkles',
        ],
        'feature_wishlist_enabled' => [
            'name' => 'Wishlist',
            'description' => 'Allow creators to create wishlists for their followers.',
            'icon' => 'Gift',
        ],
        'feature_video_chat_enabled' => [
            'name' => 'Video Chat',
            'description' => 'Real-time video sessions and live rooms.',
            'icon' => 'Video',
        ],
        'feature_messaging_enabled' => [
            'name' => 'Messaging',
            'description' => 'Direct messages and group conversations.',
            'icon' => 'MessageCircle',
        ],
        'feature_events_enabled' => [
            'name' => 'Events',
            'description' => 'Event creation, RSVPs, and calendar features.',
            'icon' => 'CalendarRange',
        ],
        'feature_bookmarks_enabled' => [
            'name' => 'Bookmarks',
            'description' => 'Save posts and profiles to your library.',
            'icon' => 'Bookmark',
        ],
        'feature_circles_enabled' => [
            'name' => 'Circles',
            'description' => 'Community groups organized around interests and locations.',
            'icon' => 'Users',
        ],
        'feature_stories_enabled' => [
            'name' => 'Stories',
            'description' => '24-hour ephemeral content and story viewer.',
            'icon' => 'ImageIcon',
        ],
        'feature_beta_enabled' => [
            'name' => 'Beta Features',
            'description' => 'Opt-in to upcoming features and layouts. Role-based access for Admin, Super Admin, and Creator roles.',
            'icon' => 'ToggleLeft',
        ],
        'feature_live_streaming_enabled' => [
            'name' => 'Live Streaming',
            'description' => 'Enable live streaming functionality.',
            'icon' => 'Video',
        ],
    ];

    public function __construct(
        private FeatureFlagService $featureFlags,
    ) {}

    /**
     * Display the feature flags management page.
     */
    public function index(Request $request): Response
    {
        $features = collect(self::FEATURES)->map(function ($meta, $key) {
            $isEnabled = (bool) AdminSetting::get($key, true);
            $hasGlobalOverride = AdminSetting::query()->where('key', $key)->exists();

            return [
                'key' => $key,
                'name' => $meta['name'],
                'description' => $meta['description'],
                'icon' => $meta['icon'],
                'enabled' => $isEnabled,
                'hasGlobalOverride' => $hasGlobalOverride,
            ];
        });

        return Inertia::render('Admin/FeatureFlags/Index', [
            'featureFlags' => $features->values(),
        ]);
    }

    /**
     * Toggle a feature globally.
     */
    public function toggle(Request $request, string $feature): RedirectResponse
    {
        $request->validate([
            'enabled' => ['required', 'boolean'],
        ]);

        if (! array_key_exists($feature, self::FEATURES)) {
            return redirect()->back()->with('error', 'Invalid feature.');
        }

        AdminSetting::set($feature, $request->boolean('enabled'));

        return redirect()->back()->with('success', "Feature '{$feature}' ".($request->boolean('enabled') ? 'enabled' : 'disabled').' globally.');
    }

    /**
     * Get users with overrides for a specific feature.
     */
    public function getUserOverrides(Request $request, string $feature): JsonResponse
    {
        if (! array_key_exists($feature, self::FEATURES)) {
            return response()->json(['error' => 'Invalid feature.'], 422);
        }

        $overrides = $this->featureFlags->getUserOverrides($feature);

        return response()->json(['overrides' => $overrides]);
    }

    /**
     * Get role overrides for a specific feature.
     */
    public function getRoleOverrides(Request $request, string $feature): JsonResponse
    {
        if (! array_key_exists($feature, self::FEATURES)) {
            return response()->json(['error' => 'Invalid feature.'], 422);
        }

        $overrides = $this->featureFlags->getRoleOverrides($feature);

        return response()->json(['overrides' => $overrides]);
    }

    /**
     * Search users for assigning feature overrides.
     */
    public function searchUsers(Request $request): JsonResponse
    {
        $request->validate([
            'query' => ['required', 'string', 'min:2'],
        ]);

        $users = User::query()
            ->where(function ($query) use ($request) {
                $query->where('email', 'like', "%{$request->string('query')}%")
                    ->orWhere('name', 'like', "%{$request->string('query')}%");
            })
            ->limit(10)
            ->get(['id', 'email', 'name'])
            ->map(fn ($user) => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name ?? $user->email,
            ]);

        return response()->json(['users' => $users]);
    }

    /**
     * Toggle a feature for a specific user.
     */
    public function toggleUser(Request $request, string $feature): JsonResponse
    {
        $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'enabled' => ['required', 'boolean'],
        ]);

        if (! array_key_exists($feature, self::FEATURES)) {
            return response()->json(['error' => 'Invalid feature.'], 422);
        }

        $user = User::findOrFail($request->integer('user_id'));
        $this->featureFlags->setUserOverride($user, $feature, $request->boolean('enabled'));

        return response()->json([
            'success' => true,
            'message' => "Feature '{$feature}' ".($request->boolean('enabled') ? 'enabled' : 'disabled')." for {$user->email}.",
        ]);
    }

    /**
     * Remove a user-specific override (user will use global/role setting).
     */
    public function removeUserOverride(Request $request, string $feature): JsonResponse
    {
        $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        if (! array_key_exists($feature, self::FEATURES)) {
            return response()->json(['error' => 'Invalid feature.'], 422);
        }

        $user = User::findOrFail($request->integer('user_id'));
        $this->featureFlags->removeUserOverride($user, $feature);

        return response()->json([
            'success' => true,
            'message' => "Removed user-specific override for '{$feature}'. User will now use role or global setting.",
        ]);
    }

    /**
     * Toggle a feature for a specific role.
     */
    public function toggleRole(Request $request, string $feature): JsonResponse
    {
        $request->validate([
            'role_name' => ['required', 'string'],
            'enabled' => ['required', 'boolean'],
        ]);

        if (! array_key_exists($feature, self::FEATURES)) {
            return response()->json(['error' => 'Invalid feature.'], 422);
        }

        $this->featureFlags->setRoleOverride($request->string('role_name'), $feature, $request->boolean('enabled'));

        return response()->json([
            'success' => true,
            'message' => "Feature '{$feature}' ".($request->boolean('enabled') ? 'enabled' : 'disabled')." for role '{$request->string('role_name')}'.",
        ]);
    }

    /**
     * Remove a role-specific override (role will use global setting).
     */
    public function removeRoleOverride(Request $request, string $feature): JsonResponse
    {
        $request->validate([
            'role_name' => ['required', 'string'],
        ]);

        if (! array_key_exists($feature, self::FEATURES)) {
            return response()->json(['error' => 'Invalid feature.'], 422);
        }

        $this->featureFlags->removeRoleOverride($request->string('role_name'), $feature);

        return response()->json([
            'success' => true,
            'message' => "Removed role-specific override for '{$feature}'. Role will now use global setting.",
        ]);
    }
}

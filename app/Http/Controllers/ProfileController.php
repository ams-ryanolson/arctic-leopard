<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\User;
use App\Services\Cache\TimelineCacheService;
use App\Services\Feed\FeedService;
use App\Services\Payments\EntitlementService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Inertia\ScrollMetadata;
use App\Support\Feed\FeedFilters;

class ProfileController extends Controller
{
    private const FEED_PAGE_NAME = 'profileFeed';

    private const FEED_PER_PAGE = 20;

    public function __construct(
        private readonly TimelineCacheService $timelineCache,
        private readonly EntitlementService $entitlements,
        private readonly FeedService $feedService,
    )
    {
    }

    public function show(Request $request, string $username): Response
    {
        $normalizedUsername = Str::lower($username);

        $user = User::query()
            ->with(['interests', 'hashtags'])
            ->where(function ($query) use ($username, $normalizedUsername): void {
                $query->where('username_lower', $normalizedUsername)
                    ->orWhere('username', $username)
                    ->orWhereRaw('LOWER(username) = ?', [$normalizedUsername]);
            })
            ->firstOrFail();

        // TODO: Privacy - Check if viewer is blocked by user
        // TODO: Privacy - Check if viewer has permission to view this profile
        // TODO: Privacy - Apply region-based blocking
        // TODO: Privacy - Check public vs authenticated access requirements

        $authUser = $request->user();
        $isOwnProfile = $authUser?->id === $user->id;

        if ($authUser !== null && $authUser->hasBlockRelationshipWith($user)) {
            return Inertia::render('Profile/Blocked', [
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'display_name' => $user->display_name,
                    'avatar_url' => $user->avatar_url,
                ],
                'blocked' => [
                    'viewer_has_blocked' => $authUser->isBlocking($user),
                    'profile_has_blocked_viewer' => $authUser->isBlockedBy($user),
                ],
                'message' => __('This profile is not available at this time.'),
            ]);
        }

        $age = $user->birthdate ? Carbon::parse($user->birthdate)->age : null;
        $followersCount = method_exists($user, 'approvedFollowers')
            ? $user->approvedFollowers()->count()
            : 0;

        $isFollowing = $authUser !== null && method_exists($authUser, 'isFollowing')
            ? $authUser->isFollowing($user)
            : false;

        $hasPendingFollowRequest = $authUser !== null && method_exists($authUser, 'hasRequestedToFollow')
            ? $authUser->hasRequestedToFollow($user)
            : false;

        if ($isFollowing) {
            $hasPendingFollowRequest = false;
        }

        $page = max(1, (int) $request->input(self::FEED_PAGE_NAME, 1));

        $feed = Inertia::scroll(
            function () use ($request, $user, $authUser, $page) {
                return $this->timelineCache->rememberUserFeed(
                    $user,
                    $authUser,
                    $page,
                    function () use ($request, $user, $authUser, $page) {
                        return $this->feedService->getUserFeed(
                            $user,
                            $authUser,
                            $page,
                            self::FEED_PER_PAGE,
                            $request,
                            self::FEED_PAGE_NAME,
                        );
                    },
                );
            },
            metadata: static function (array $payload): ScrollMetadata {
                $current = (int) data_get($payload, 'meta.current_page', 1);
                $last = (int) data_get($payload, 'meta.last_page', $current);

                return new ScrollMetadata(
                    ProfileController::FEED_PAGE_NAME,
                    $current > 1 ? $current - 1 : null,
                    $current < $last ? $current + 1 : null,
                    $current,
                );
            },
        );

        return Inertia::render('Profile/Show', [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'display_name' => $user->display_name,
                'pronouns' => $user->pronouns,
                'bio' => $user->bio,
                'avatar_url' => $user->avatar_url,
                'cover_url' => $user->cover_url,
                'age' => $age,
                'location_city' => $user->location_city,
                'location_region' => $user->location_region,
                'location_country' => $user->location_country,
                'location' => $this->formatLocation($user),
                'interests' => $user->interests->pluck('name')->all(),
                'hashtags' => $user->hashtags->pluck('name')->all(),
                'is_following' => $isFollowing,
                'can_follow' => ! $isOwnProfile,
                'requires_follow_approval' => (bool) $user->requires_follow_approval,
                'followers_count' => $followersCount,
                'is_traveling' => (bool) $user->is_traveling,
                // TODO: Add followers_count when Follow model exists
                // TODO: Add following_count when Follow model exists
                // TODO: Add is_following when Follow model exists
            ],
            'isOwnProfile' => $isOwnProfile,
            'feed' => $feed,
            'feedPageName' => self::FEED_PAGE_NAME,
            'feedPerPage' => self::FEED_PER_PAGE,
            'filters' => FeedFilters::defaults(),
            'viewer' => [
                'id' => $authUser?->getKey(),
                'can_follow' => $authUser !== null && ! $isOwnProfile,
                'is_following' => $isFollowing,
                'has_pending_follow_request' => $hasPendingFollowRequest,
                'has_subscription' => $authUser !== null
                    ? $this->entitlements->hasActiveSubscription($authUser, $user)
                    : false,
                'can_block' => $authUser !== null && ! $isOwnProfile && config('block.enabled'),
                'has_blocked' => $authUser !== null ? $authUser->isBlocking($user) : false,
                'is_blocked_by' => $authUser !== null ? $authUser->isBlockedBy($user) : false,
            ],
            'stats' => $this->profileStats($user, $followersCount),
        ]);
    }

    private function formatLocation(User $user): ?string
    {
        $parts = array_filter([
            $user->location_region,
            $user->location_country,
        ]);

        return empty($parts) ? null : implode(', ', $parts);
    }

    /**
     * @return array<string, int>
     */
    private function profileStats(User $user, ?int $followersCount = null): array
    {
        $postCount = Post::query()->forAuthor($user)->count();
        $followersCount = $followersCount ?? (method_exists($user, 'approvedFollowers')
            ? $user->approvedFollowers()->count()
            : 0);
        $subscriberCount = $user->subscribers()->count();

        return [
            'posts' => $postCount,
            'followers' => $followersCount,
            'subscribers' => $subscriberCount,
        ];
    }
}


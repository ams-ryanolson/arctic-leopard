<?php

namespace App\Http\Controllers;

use App\Http\Resources\PostResource;
use App\Models\AdminSetting;
use App\Models\Bookmark;
use App\Models\Comment;
use App\Models\Memberships\MembershipPlan;
use App\Models\Post;
use App\Models\PostMedia;
use App\Models\User;
use App\Models\Wishlists\WishlistItem;
use App\Services\Cache\TimelineCacheService;
use App\Services\Feed\FeedService;
use App\Services\Messaging\MessagingAuthorizationService;
use App\Services\Payments\EntitlementService;
use App\Support\Feed\FeedFilters;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Inertia\ScrollMetadata;

class ProfileController extends Controller
{
    private const FEED_PAGE_NAME = 'profileFeed';

    private const FEED_PER_PAGE = 20;

    private const MEDIA_PAGE_NAME = 'profileMedia';

    private const MEDIA_PER_PAGE = 30;

    public function __construct(
        private readonly TimelineCacheService $timelineCache,
        private readonly EntitlementService $entitlements,
        private readonly FeedService $feedService,
        private readonly MessagingAuthorizationService $messagingAuthorization,
    ) {}

    public function show(Request $request, string $username): Response
    {
        $normalizedUsername = Str::lower($username);

        $user = User::query()
            ->with(['interests', 'hashtags', 'circles'])
            ->where(function ($query) use ($username, $normalizedUsername): void {
                $query->where('username_lower', $normalizedUsername)
                    ->orWhere('username', $username)
                    ->orWhereRaw('LOWER(username) = ?', [$normalizedUsername]);
            })
            ->firstOrFail();

        $authUser = $request->user();

        // Show public preview for unauthenticated users
        if ($authUser === null) {
            return $this->showPublicPreview($user, $request);
        }

        // TODO: Privacy - Check if viewer is blocked by user
        // TODO: Privacy - Check if viewer has permission to view this profile
        // TODO: Privacy - Apply region-based blocking
        // TODO: Privacy - Check public vs authenticated access requirements
        $isOwnProfile = $authUser?->id === $user->id;
        $isCreator = $user->hasRole('Creator');

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

        // Fetch recent media from user's posts (photos and videos) with post data
        $recentMedia = PostMedia::query()
            ->whereHas('post', function ($query) use ($user): void {
                $query->where('user_id', $user->id)
                    ->whereNotNull('published_at');
            })
            ->with([
                'post' => function ($query) use ($authUser): void {
                    $query->with([
                        'author',
                        'media',
                        'poll.options',
                        'hashtags',
                    ])
                        ->withCount(['bookmarks as bookmarks_count'])
                        ->withBookmarkStateFor($authUser);
                },
            ])
            ->orderBy('created_at', 'desc')
            ->limit(12)
            ->get()
            ->map(function (PostMedia $media) use ($request, $authUser) {
                $post = $media->post;
                $postData = null;

                if ($post !== null) {
                    // Attach viewer state (likes, bookmarks)
                    if ($authUser !== null) {
                        $authUser->attachLikeStatus($post);
                        $authUser->attachBookmarkStatus($post);
                    }

                    // Use PostResource to format the post data
                    $postData = (new PostResource($post))->toArray($request);
                }

                return [
                    'id' => $media->id,
                    'url' => $media->url,
                    'thumbnail_url' => $media->thumbnail_url,
                    'mime_type' => $media->mime_type,
                    'is_video' => str_starts_with($media->mime_type ?? '', 'video/'),
                    'post_id' => $media->post_id,
                    'post' => $postData,
                ];
            });

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
                'circles' => $user->circles->map(fn ($circle) => [
                    'id' => $circle->id,
                    'name' => $circle->name,
                    'slug' => $circle->slug,
                ])->all(),
                'is_following' => $isFollowing,
                'can_follow' => ! $isOwnProfile,
                'requires_follow_approval' => (bool) $user->requires_follow_approval,
                'followers_count' => $followersCount,
                'is_traveling' => (bool) $user->is_traveling,
                'is_creator' => $isCreator,
                'is_verified' => $user->isIdVerified(),
                // TODO: Add followers_count when Follow model exists
                // TODO: Add following_count when Follow model exists
                // TODO: Add is_following when Follow model exists
            ],
            'recentMedia' => $recentMedia,
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
                'can_message' => $authUser !== null && ! $isOwnProfile
                    ? $this->messagingAuthorization->canMessage($authUser, $user)
                    : false,
                'can_receive_gift' => $authUser !== null && ! $isOwnProfile && $this->canReceiveGift($user),
            ],
            'giftMembershipPlans' => $authUser !== null && ! $isOwnProfile
                ? $this->getAvailableGiftMembershipPlans()
                : [],
            'stats' => $this->profileStats($user, $followersCount),
        ]);
    }

    /**
     * Show public profile preview for unauthenticated users.
     */
    private function showPublicPreview(User $user, Request $request): Response
    {
        $followersCount = method_exists($user, 'approvedFollowers')
            ? $user->approvedFollowers()->count()
            : 0;

        $followingCount = method_exists($user, 'approvedFollowings')
            ? $user->approvedFollowings()->count()
            : 0;

        $postsCount = Post::query()->forAuthor($user)->count();

        $profileUrl = $request->url();

        return Inertia::render('Profile/Preview', [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'display_name' => $user->display_name,
                'pronouns' => $user->pronouns,
                'bio' => $user->bio,
                'avatar_url' => $user->avatar_url,
                'cover_url' => $user->cover_url,
                'location' => $this->formatLocation($user),
                'is_traveling' => (bool) $user->is_traveling,
                'is_creator' => $user->hasRole('Creator'),
                'is_verified' => $user->isIdVerified(),
                'interests' => $user->interests->pluck('name')->all(),
                'hashtags' => $user->hashtags->pluck('name')->all(),
                'circles' => $user->circles->map(fn ($circle) => [
                    'id' => $circle->id,
                    'name' => $circle->name,
                    'slug' => $circle->slug,
                ])->all(),
            ],
            'stats' => [
                'followers' => $followersCount,
                'following' => $followingCount,
                'posts' => $postsCount,
            ],
            'profileUrl' => $profileUrl,
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
        $followingCount = method_exists($user, 'approvedFollowings')
            ? $user->approvedFollowings()->count()
            : 0;
        $subscriberCount = $user->subscribers()->count();

        $stats = [
            'posts' => $postCount,
            'followers' => $followersCount,
            'following' => $followingCount,
            'subscribers' => $subscriberCount,
        ];

        // Comments count
        $stats['comments'] = Comment::query()
            ->where('user_id', $user->id)
            ->count();

        // Bookmarks count
        $stats['bookmarks'] = Bookmark::query()
            ->where('user_id', $user->id)
            ->count();

        // Wishlist items count (if feature enabled)
        if ((bool) AdminSetting::get('feature_signals_enabled', true) && (bool) AdminSetting::get('feature_wishlist_enabled', true)) {
            $stats['wishlist_items'] = WishlistItem::query()
                ->where('creator_id', $user->id)
                ->count();
        }

        return $stats;
    }

    public function media(Request $request, string $username): Response
    {
        $normalizedUsername = Str::lower($username);

        $user = User::query()
            ->where(function ($query) use ($username, $normalizedUsername): void {
                $query->where('username_lower', $normalizedUsername)
                    ->orWhere('username', $username)
                    ->orWhereRaw('LOWER(username) = ?', [$normalizedUsername]);
            })
            ->firstOrFail();

        $authUser = $request->user();

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

        $page = max(1, (int) $request->input(self::MEDIA_PAGE_NAME, 1));

        $media = Inertia::scroll(
            function () use ($request, $user, $authUser, $page) {
                $query = PostMedia::query()
                    ->whereHas('post', function ($query) use ($user): void {
                        $query->where('user_id', $user->id)
                            ->whereNotNull('published_at');
                    })
                    ->with([
                        'post' => function ($query) use ($authUser): void {
                            $query->with([
                                'author',
                                'media',
                                'poll.options',
                                'hashtags',
                            ])
                                ->withCount(['bookmarks as bookmarks_count'])
                                ->withBookmarkStateFor($authUser);
                        },
                    ])
                    ->orderBy('created_at', 'desc');

                $paginator = $query->paginate(
                    self::MEDIA_PER_PAGE,
                    ['*'],
                    self::MEDIA_PAGE_NAME,
                    $page,
                );

                $items = $paginator->getCollection()->map(function (PostMedia $media) use ($request, $authUser) {
                    $post = $media->post;
                    $postData = null;

                    if ($post !== null) {
                        // Attach viewer state (likes, bookmarks)
                        if ($authUser !== null) {
                            $authUser->attachLikeStatus($post);
                            $authUser->attachBookmarkStatus($post);
                        }

                        // Use PostResource to format the post data
                        $postData = (new PostResource($post))->toArray($request);
                    }

                    return [
                        'id' => $media->id,
                        'url' => $media->url,
                        'thumbnail_url' => $media->thumbnail_url,
                        'optimized_url' => $media->optimized_url,
                        'blur_url' => $media->blur_url,
                        'mime_type' => $media->mime_type,
                        'is_video' => str_starts_with($media->mime_type ?? '', 'video/'),
                        'post_id' => $media->post_id,
                        'width' => $media->width,
                        'height' => $media->height,
                        'post' => $postData,
                    ];
                });

                return [
                    'data' => $items->all(),
                    'meta' => [
                        'current_page' => $paginator->currentPage(),
                        'last_page' => $paginator->lastPage(),
                        'per_page' => $paginator->perPage(),
                        'total' => $paginator->total(),
                    ],
                ];
            },
            metadata: static function (array $payload): ScrollMetadata {
                $current = (int) data_get($payload, 'meta.current_page', 1);
                $last = (int) data_get($payload, 'meta.last_page', $current);

                return new ScrollMetadata(
                    ProfileController::MEDIA_PAGE_NAME,
                    $current > 1 ? $current - 1 : null,
                    $current < $last ? $current + 1 : null,
                    $current,
                );
            },
        );

        return Inertia::render('Profile/Media', [
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'display_name' => $user->display_name,
                'avatar_url' => $user->avatar_url,
            ],
            'media' => $media,
            'mediaPageName' => self::MEDIA_PAGE_NAME,
            'mediaPerPage' => self::MEDIA_PER_PAGE,
        ]);
    }

    /**
     * Check if a user can receive a gift membership (doesn't have active membership).
     */
    private function canReceiveGift(User $user): bool
    {
        return ! $user->memberships()
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>', now());
            })
            ->exists();
    }

    /**
     * Get available membership plans for gifting (one-time only).
     *
     * @return array<int, array<string, mixed>>
     */
    private function getAvailableGiftMembershipPlans(): array
    {
        return MembershipPlan::query()
            ->where('is_active', true)
            ->where('is_public', true)
            ->where('allows_one_time', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get()
            ->map(static function (MembershipPlan $plan) {
                return [
                    'id' => $plan->id,
                    'uuid' => $plan->uuid,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'description' => $plan->description,
                    'monthly_price' => $plan->monthly_price,
                    'currency' => $plan->currency,
                    'one_time_duration_days' => $plan->one_time_duration_days,
                ];
            })
            ->all();
    }
}

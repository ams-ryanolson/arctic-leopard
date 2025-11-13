<?php

namespace App\Http\Controllers;

use App\Enums\Ads\AdPlacement;
use App\Enums\PostAudience;
use App\Enums\PostType;
use App\Http\Resources\Ads\AdCreativeResource;
use App\Models\Ads\Ad;
use App\Models\Comment;
use App\Models\Hashtag;
use App\Models\Post;
use App\Models\PostPurchase;
use App\Services\Ads\AdServingService;
use App\Services\Cache\TimelineCacheService;
use App\Services\Feed\FeedService;
use App\Support\Feed\FeedFilters;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Inertia\ScrollMetadata;

class DashboardController extends Controller
{
    private const TIMELINE_PAGE_NAME = 'timeline';

    private const TIMELINE_PER_PAGE = 20;

    public function __construct(
        private readonly TimelineCacheService $timelineCache,
        private readonly FeedService $feedService,
        private readonly AdServingService $adServingService,
    ) {}

    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $page = max(1, (int) $request->input(self::TIMELINE_PAGE_NAME, 1));

        $timeline = Inertia::scroll(
            function () use ($request, $user, $page) {
                if ($user === null) {
                    return [
                        'data' => [],
                        'links' => [],
                        'meta' => [
                            'current_page' => 1,
                            'last_page' => 1,
                            'per_page' => self::TIMELINE_PER_PAGE,
                            'total' => 0,
                        ],
                    ];
                }

                return $this->timelineCache->rememberFollowingFeed($user, $page, function () use ($request, $user, $page) {
                    return $this->feedService->getFollowingFeed(
                        $user,
                        $page,
                        self::TIMELINE_PER_PAGE,
                        $request,
                        self::TIMELINE_PAGE_NAME,
                    );
                });
            },
            metadata: static function (array $payload): ScrollMetadata {
                $current = (int) data_get($payload, 'meta.current_page', 1);
                $last = (int) data_get($payload, 'meta.last_page', $current);

                return new ScrollMetadata(
                    DashboardController::TIMELINE_PAGE_NAME,
                    $current > 1 ? $current - 1 : null,
                    $current < $last ? $current + 1 : null,
                    $current,
                );
            },
        );

        return Inertia::render('Dashboard/Index', [
            'timeline' => $timeline,
            'timelinePageName' => self::TIMELINE_PAGE_NAME,
            'timelinePerPage' => self::TIMELINE_PER_PAGE,
            'composer' => $this->buildComposerConfig($user),
            'filters' => FeedFilters::defaults(),
            'pulse' => $user ? $this->buildScenePulse($user) : [],
            'trending' => $this->trendingTags(),
            'sidebarAds' => Inertia::defer(fn () => $this->getSidebarAds($user, $request)),
            'viewer' => [
                'id' => $user?->getKey(),
                'name' => $user?->display_name ?? $user?->username,
                'avatar' => $user?->avatar_url,
                'has_completed_profile' => (bool) ($user?->profile_completed_at),
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildComposerConfig(?\App\Models\User $user): array
    {
        return [
            'can_post' => $user !== null,
            'post_types' => array_map(
                static fn (PostType $type) => [
                    'value' => $type->value,
                    'label' => $type->name,
                ],
                PostType::cases(),
            ),
            'audiences' => array_map(
                static fn (PostAudience $audience) => [
                    'value' => $audience->value,
                    'label' => $audience->name,
                ],
                PostAudience::cases(),
            ),
            'media' => [
                'max_file_size_kb' => (int) config('uploads.max_file_size'),
                'accepted_mime_types' => config('uploads.allowed_mime_types', []),
            ],
        ];
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function buildScenePulse(\App\Models\User $user): array
    {
        $since = Carbon::now()->subDay();

        $recentPosts = Post::query()
            ->forAuthor($user)
            ->where('published_at', '>=', $since)
            ->count();

        $recentComments = Comment::query()
            ->whereHas('post', static fn ($query) => $query->where('user_id', $user->getKey()))
            ->where('created_at', '>=', $since)
            ->count();

        $recentUnlocks = PostPurchase::query()
            ->whereHas('post', static fn ($query) => $query->where('user_id', $user->getKey()))
            ->where('created_at', '>=', $since)
            ->count();

        $pendingCircleApprovals = method_exists($user, 'notApprovedFollowers')
            ? $user->notApprovedFollowers()->count()
            : 0;

        $heatScore = (int) min(100, round(($recentPosts * 6) + ($recentComments * 3) + ($recentUnlocks * 8)));

        return [
            [
                'title' => 'Heat Index',
                'value' => $heatScore.'%',
                'description' => 'Composite of posts, comments, and unlocks in the last 24 hours.',
            ],
            [
                'title' => 'Mentions',
                'value' => number_format($recentComments),
                'description' => 'Replies across your scenes in the last 24 hours.',
            ],
            [
                'title' => 'Circle Invites',
                'value' => $pendingCircleApprovals > 0
                    ? $pendingCircleApprovals.' pending'
                    : 'All clear',
                'description' => 'Followers waiting on approval.',
            ],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function trendingTags(): array
    {
        return Hashtag::query()
            ->orderByDesc('usage_count')
            ->limit(3)
            ->get(['id', 'name', 'usage_count'])
            ->map(static fn (Hashtag $hashtag) => [
                'id' => $hashtag->getKey(),
                'tag' => '#'.$hashtag->name,
                'usage_count' => $hashtag->usage_count,
            ])
            ->all();
    }

    /**
     * Get sidebar ads for dashboard from all sidebar placements in equal rotation.
     * Returns 1-2 ads, positioned away from each other.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getSidebarAds(?\App\Models\User $user, Request $request): array
    {
        $context = [
            'session_id' => $request->session()->getId(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ];

        // Get all eligible ads from all sidebar placements
        $allPlacements = [
            AdPlacement::DashboardSidebarSmall,
            AdPlacement::DashboardSidebarMedium,
            AdPlacement::DashboardSidebarLarge,
        ];

        $allEligibleCreatives = collect();

        // Collect all eligible creatives from all placements
        foreach ($allPlacements as $placement) {
            $ads = Ad::query()
                ->eligible()
                ->forPlacement($placement)
                ->forViewer($user)
                ->with(['creatives' => function ($query) use ($placement): void {
                    $query->where('placement', $placement->value)
                        ->where('is_active', true)
                        ->where('review_status', 'approved')
                        ->orderBy('display_order');
                }])
                ->get();

            foreach ($ads as $ad) {
                if ($this->adServingService->isEligible($ad, $user, $context)) {
                    $creative = $ad->creatives
                        ->where('placement', $placement->value)
                        ->where('is_active', true)
                        ->where('review_status', 'approved')
                        ->first();

                    if ($creative !== null) {
                        $allEligibleCreatives->push([
                            'creative' => $creative,
                            'placement' => $placement,
                        ]);
                    }
                }
            }
        }

        if ($allEligibleCreatives->isEmpty()) {
            return [];
        }

        // Randomly select 1-2 ads from the combined pool (equal rotation across all sizes)
        $count = min($allEligibleCreatives->count(), mt_rand(1, 2));
        $selected = $allEligibleCreatives->shuffle()->take($count);

        $result = [];
        foreach ($selected as $item) {
            $creative = $item['creative'];
            $placement = $item['placement'];

            // Record impression
            $this->adServingService->recordImpression(
                $creative,
                $placement,
                $user,
                $context
            );

            $result[] = (new AdCreativeResource($creative))->toArray($request);
        }

        return $result;
    }
}

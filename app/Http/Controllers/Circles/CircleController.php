<?php

namespace App\Http\Controllers\Circles;

use App\Enums\Ads\AdPlacement;
use App\Http\Controllers\Controller;
use App\Http\Requests\Circles\CircleFilterRequest;
use App\Http\Requests\Circles\SuggestCircleRequest;
use App\Http\Resources\Ads\AdCreativeResource;
use App\Http\Resources\CircleResource;
use App\Models\Ads\Ad;
use App\Models\Circle;
use App\Models\CircleSuggestion;
use App\Models\Interest;
use App\Services\Ads\AdServingService;
use App\Services\Feed\FeedService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CircleController extends Controller
{
    public function __construct(
        private readonly FeedService $feedService,
        private readonly AdServingService $adServingService,
    ) {}

    /**
     * Display a listing of available circles.
     */
    public function index(CircleFilterRequest $request): Response
    {
        $user = $request->user();
        $filters = $request->validated();

        $circlesQuery = Circle::query()
            ->with(['interest'])
            ->withCount('members as members_count')
            ->with(['facets' => fn ($query) => $query->orderBy('sort_order')])
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($user) {
            $circlesQuery->with([
                'members' => fn ($members) => $members
                    ->select('users.id')
                    ->where('user_id', $user->getKey()),
            ]);
        }

        if ($search = $filters['search'] ?? null) {
            $circlesQuery->where(fn ($query) => $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('tagline', 'like', "%{$search}%"));
        }

        if ($interestSlug = $filters['interest'] ?? null) {
            $circlesQuery->whereHas('interest', fn ($query) => $query->where('slug', $interestSlug));
        }

        if (! empty($filters['joined']) && $user) {
            $circlesQuery->whereHas('members', fn ($query) => $query->where('user_id', $user->getKey()));
        }

        if (($sort = $filters['sort'] ?? null) === 'members') {
            $circlesQuery->orderByDesc('members_count');
        } elseif ($sort === 'recent') {
            $circlesQuery->latest();
        }

        $paginator = $circlesQuery
            ->paginate(12)
            ->withQueryString();

        $joinedCircles = collect();

        if ($user) {
            $joinedCircles = Circle::query()
                ->with(['interest'])
                ->withCount('members as members_count')
                ->with(['facets' => fn ($query) => $query->orderBy('sort_order')])
                ->with([
                    'members' => fn ($members) => $members
                        ->select('users.id')
                        ->where('user_id', $user->getKey()),
                ])
                ->whereHas('members', fn ($query) => $query->where('user_id', $user->getKey()))
                ->orderBy('sort_order')
                ->orderBy('name')
                ->take(12)
                ->get();
        }

        $interestOptions = Interest::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (Interest $interest) => [
                'id' => $interest->id,
                'name' => $interest->name,
                'slug' => $interest->slug,
            ]);

        return Inertia::render('Circles/Index', [
            'filters' => [
                'search' => $filters['search'] ?? null,
                'interest' => $filters['interest'] ?? null,
                'joined' => (bool) ($filters['joined'] ?? false),
                'sort' => $filters['sort'] ?? null,
            ],
            'joinedCircles' => CircleResource::collection($joinedCircles)->resolve($request),
            'circles' => [
                'data' => CircleResource::collection($paginator->getCollection())->resolve($request),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'has_more_pages' => $paginator->hasMorePages(),
                ],
            ],
            'interests' => $interestOptions,
        ]);
    }

    /**
     * Display a specific circle.
     */
    public function show(Request $request, Circle $circle): Response
    {
        $this->authorize('view', $circle);

        $user = $request->user();

        $circle->load([
            'interest',
            'facets' => fn ($query) => $query->orderByDesc('is_default')->orderBy('sort_order'),
        ])->loadCount('members as members_count');

        $membership = null;
        if ($user) {
            $circle->load([
                'members' => fn ($members) => $members
                    ->select('users.id')
                    ->where('user_id', $user->getKey()),
            ]);

            // Get membership to access preferences
            $member = $circle->members->first();
            if ($member !== null) {
                $membership = $member->pivot;
            }
        }

        $page = max(1, (int) $request->integer('page', 1));

        // Determine which facet to use: query param > membership preference > default facet
        $facetValue = $request->query('facet');
        if ($facetValue === null && $membership !== null && isset($membership->preferences['facet'])) {
            $facetValue = $membership->preferences['facet'];
        }

        $postsPayload = $this->feedService->getCircleFeed(
            $circle,
            $user,
            $page,
            10,
            $request,
            $facetValue,
        );

        return Inertia::render('Circles/Show', [
            'circle' => (new CircleResource($circle))->resolve($request),
            'posts' => [
                'data' => $postsPayload['data'] ?? [],
                'meta' => [
                    'current_page' => (int) data_get($postsPayload, 'meta.current_page', $page),
                    'per_page' => (int) data_get($postsPayload, 'meta.per_page', 10),
                    'total' => (int) data_get($postsPayload, 'meta.total', 0),
                    'has_more_pages' => (bool) data_get(
                        $postsPayload,
                        'meta.has_more_pages',
                        (int) data_get($postsPayload, 'meta.current_page', $page)
                            < (int) data_get($postsPayload, 'meta.last_page', $page),
                    ),
                ],
            ],
            'filters' => [
                'facet' => $facetValue,
            ],
            'sidebarAds' => Inertia::defer(fn () => $this->getSidebarAds($user, $request)),
        ]);
    }

    /**
     * Get sidebar ads for circle page from all sidebar placements in equal rotation.
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

        // Try circle sidebar placements first, then fall back to dashboard sidebar placements
        $allPlacements = [
            AdPlacement::CircleSidebarSmall,
            AdPlacement::CircleSidebarMedium,
            AdPlacement::CircleSidebarLarge,
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

    /**
     * Store a circle suggestion.
     */
    public function suggest(SuggestCircleRequest $request): RedirectResponse
    {
        CircleSuggestion::create([
            'user_id' => $request->user()->id,
            'name' => $request->validated()['name'],
            'description' => $request->validated()['description'],
            'status' => 'pending',
        ]);

        return back()->with('flash', [
            'type' => 'success',
            'message' => __('Your circle suggestion has been submitted. We\'ll review it and get back to you.'),
        ]);
    }
}

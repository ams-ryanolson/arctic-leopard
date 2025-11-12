<?php

namespace App\Http\Controllers\Circles;

use App\Http\Controllers\Controller;
use App\Http\Requests\Circles\CircleFilterRequest;
use App\Http\Resources\CircleResource;
use App\Models\Circle;
use App\Models\Interest;
use App\Services\Feed\FeedService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CircleController extends Controller
{
    public function __construct(private readonly FeedService $feedService)
    {
    }

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

        $featured = Circle::query()
            ->with('interest')
            ->withCount('members as members_count')
            ->when($user, fn ($query) => $query->with([
                'members' => fn ($members) => $members
                    ->select('users.id')
                    ->where('user_id', $user->getKey()),
            ]))
            ->where('is_featured', true)
            ->orderBy('sort_order')
            ->take(6)
            ->get();

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
            'featured' => CircleResource::collection($featured)->resolve($request),
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

        if ($user) {
            $circle->load([
                'members' => fn ($members) => $members
                    ->select('users.id')
                    ->where('user_id', $user->getKey()),
            ]);
        }

        $page = max(1, (int) $request->integer('page', 1));

        $postsPayload = $this->feedService->getCircleFeed(
            $circle,
            $user,
            $page,
            10,
            $request,
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
                'facet' => $request->query('facet'),
            ],
        ]);
    }
}

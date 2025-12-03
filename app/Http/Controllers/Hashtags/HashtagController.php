<?php

namespace App\Http\Controllers\Hashtags;

use App\Http\Controllers\Controller;
use App\Http\Resources\HashtagResource;
use App\Http\Resources\PostResource;
use App\Models\Hashtag;
use App\Models\Post;
use App\Services\Search\SearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HashtagController extends Controller
{
    public function __construct(
        private readonly SearchService $searchService,
    ) {}

    /**
     * List all hashtags.
     */
    public function index(Request $request): JsonResponse|Response
    {
        $perPage = $request->integer('per_page', 50);
        $sortBy = $request->string('sort', 'recent')->toString(); // 'recent' or 'popular'

        $query = Hashtag::query();

        if ($sortBy === 'recent') {
            // Sort by recent usage (24h) - we'll need to calculate this
            $hashtags = $query->get()->map(function (Hashtag $hashtag) {
                $hashtag->recent_usage_count = $this->searchService->getRecentHashtagUsage($hashtag);

                return $hashtag;
            })->sortByDesc('recent_usage_count')->values();
        } else {
            // Sort by total usage_count
            $hashtags = $query->orderByDesc('usage_count')->get();
        }

        $paginated = $hashtags->forPage($request->integer('page', 1), $perPage);

        if ($request->expectsJson()) {
            return response()->json([
                'data' => HashtagResource::collection($paginated),
                'meta' => [
                    'current_page' => $request->integer('page', 1),
                    'per_page' => $perPage,
                    'total' => $hashtags->count(),
                ],
            ]);
        }

        return Inertia::render('Hashtags/Index', [
            'hashtags' => HashtagResource::collection($paginated)->resolve($request),
            'meta' => [
                'current_page' => $request->integer('page', 1),
                'per_page' => $perPage,
                'total' => $hashtags->count(),
            ],
        ]);
    }

    /**
     * Show hashtag with posts.
     */
    public function show(Request $request, Hashtag $hashtag): JsonResponse|Response
    {
        $viewer = $request->user();
        $perPage = $request->integer('per_page', 20);

        $hashtag->recent_usage_count = $this->searchService->getRecentHashtagUsage($hashtag);

        $posts = Post::query()
            ->with(['author', 'media', 'poll.options', 'hashtags'])
            ->whereHas('hashtags', function ($query) use ($hashtag) {
                $query->where('hashtags.id', $hashtag->id);
            })
            ->visibleTo($viewer)
            ->latest('published_at')
            ->paginate($perPage);

        if ($viewer !== null) {
            $viewer->attachLikeStatus($posts);
            $viewer->attachBookmarkStatus($posts);
        }

        if ($request->expectsJson()) {
            return response()->json([
                'hashtag' => (new HashtagResource($hashtag))->toArray($request),
                'posts' => PostResource::collection($posts)->toResponse($request)->getData(true),
            ]);
        }

        // Get trending hashtags (excluding current one)
        $trendingHashtags = Hashtag::query()
            ->where('id', '!=', $hashtag->id)
            ->orderByDesc('usage_count')
            ->limit(5)
            ->get(['id', 'name', 'usage_count', 'slug'])
            ->map(static fn (Hashtag $tag) => [
                'id' => $tag->getKey(),
                'name' => $tag->name,
                'slug' => $tag->slug,
                'usage_count' => $tag->usage_count,
            ])
            ->all();

        return Inertia::render('Hashtags/Show', [
            'hashtag' => (new HashtagResource($hashtag))->toArray($request),
            'posts' => PostResource::collection($posts)->toResponse($request)->getData(true),
            'trendingHashtags' => $trendingHashtags,
        ]);
    }

    /**
     * Get posts for a hashtag (API endpoint).
     */
    public function posts(Request $request, Hashtag $hashtag): JsonResponse
    {
        $viewer = $request->user();
        $perPage = $request->integer('per_page', 20);

        $posts = Post::query()
            ->with(['author', 'media', 'poll.options', 'hashtags'])
            ->whereHas('hashtags', function ($query) use ($hashtag) {
                $query->where('hashtags.id', $hashtag->id);
            })
            ->visibleTo($viewer)
            ->latest('published_at')
            ->paginate($perPage);

        if ($viewer !== null) {
            $viewer->attachLikeStatus($posts);
            $viewer->attachBookmarkStatus($posts);
        }

        return PostResource::collection($posts)->toResponse($request);
    }
}

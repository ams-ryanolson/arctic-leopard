<?php

namespace App\Http\Controllers\Search;

use App\Http\Controllers\Controller;
use App\Http\Resources\SearchResultResource;
use App\Services\Search\SearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    public function __construct(
        private readonly SearchService $searchService,
    ) {}

    /**
     * Autocomplete endpoint for search dropdown.
     */
    public function autocomplete(Request $request): JsonResponse
    {
        $query = $request->string('q')->toString();

        if (strlen($query) < 2) {
            return response()->json([
                'users' => ['data' => []],
                'events' => ['data' => []],
                'circles' => ['data' => []],
                'hashtags' => ['data' => []],
            ]);
        }

        $results = $this->searchService->searchAll($query, null, 5);

        return response()->json([
            'users' => [
                'data' => SearchResultResource::collection($results['users'])->resolve($request),
            ],
            'events' => [
                'data' => SearchResultResource::collection($results['events'])->resolve($request),
            ],
            'circles' => [
                'data' => SearchResultResource::collection($results['circles'])->resolve($request),
            ],
            'hashtags' => [
                'data' => SearchResultResource::collection($results['hashtags'])->resolve($request),
            ],
        ]);
    }

    /**
     * Full search results page.
     */
    public function index(Request $request): JsonResponse|Response
    {
        $query = $request->string('q')->toString();
        $type = $request->string('type')->toString() ?: null;

        $perPage = $request->integer('per_page', 20);

        if ($query === '') {
            $popular = $this->searchService->getPopularContent(10);

            if ($request->expectsJson()) {
                return response()->json([
                    'query' => '',
                    'type' => $type,
                    'users' => SearchResultResource::collection($popular['users'])->resolve($request),
                    'events' => SearchResultResource::collection($popular['events'])->resolve($request),
                    'circles' => SearchResultResource::collection($popular['circles'])->resolve($request),
                    'hashtags' => SearchResultResource::collection($popular['hashtags'])->resolve($request),
                ]);
            }

            return Inertia::render('Search/Index', [
                'query' => '',
                'type' => $type,
                'users' => SearchResultResource::collection($popular['users'])->resolve($request),
                'events' => SearchResultResource::collection($popular['events'])->resolve($request),
                'circles' => SearchResultResource::collection($popular['circles'])->resolve($request),
                'hashtags' => SearchResultResource::collection($popular['hashtags'])->resolve($request),
            ]);
        }

        $results = $this->searchService->searchAll($query, $type, $perPage);

        if ($request->expectsJson()) {
            return response()->json([
                'query' => $query,
                'type' => $type,
                'users' => SearchResultResource::collection($results['users']),
                'events' => SearchResultResource::collection($results['events']),
                'circles' => SearchResultResource::collection($results['circles']),
                'hashtags' => SearchResultResource::collection($results['hashtags']),
            ]);
        }

        return Inertia::render('Search/Index', [
            'query' => $query,
            'type' => $type,
            'users' => SearchResultResource::collection($results['users'])->resolve($request),
            'events' => SearchResultResource::collection($results['events'])->resolve($request),
            'circles' => SearchResultResource::collection($results['circles'])->resolve($request),
            'hashtags' => SearchResultResource::collection($results['hashtags'])->resolve($request),
        ]);
    }

    /**
     * Search mentions for composer autocomplete.
     */
    public function mentions(Request $request): JsonResponse
    {
        $query = $request->string('q')->toString();
        $user = $request->user();

        $results = $this->searchService->searchMentions($query, $user, 8);

        return response()->json([
            'data' => SearchResultResource::collection($results)->resolve($request),
        ]);
    }

    /**
     * Search hashtags for composer autocomplete.
     */
    public function hashtags(Request $request): JsonResponse
    {
        $query = $request->string('q')->toString();
        $user = $request->user();

        $results = $this->searchService->searchHashtagsForComposer($query, $user, 8);

        return response()->json([
            'data' => SearchResultResource::collection($results)->resolve($request),
        ]);
    }
}

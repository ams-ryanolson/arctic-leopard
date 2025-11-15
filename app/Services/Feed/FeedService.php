<?php

namespace App\Services\Feed;

use App\Enums\Ads\AdPlacement;
use App\Http\Resources\Ads\AdCreativeResource;
use App\Http\Resources\PostResource;
use App\Http\Resources\TimelineEntryResource;
use App\Models\Circle;
use App\Models\Post;
use App\Models\Timeline;
use App\Models\User;
use App\Services\Ads\AdServingService;
use App\Services\Cache\TimelineCacheService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class FeedService
{
    public function __construct(
        private AdServingService $adServingService,
    ) {}

    public function getFollowingFeed(
        User $viewer,
        int $page,
        int $perPage,
        Request $request,
        string $pageName = 'page',
    ): array {
        $entries = Timeline::query()
            ->forViewer($viewer)
            ->visible()
            ->with([
                'post' => static function ($query) use ($viewer): void {
                    $query->with([
                        'author',
                        'media',
                        'poll.options',
                        'hashtags',
                    ])
                        ->withCount(['bookmarks as bookmarks_count'])
                        ->withBookmarkStateFor($viewer);
                },
            ])
            ->latest('created_at')
            ->paginate(perPage: $perPage, page: $page, pageName: $pageName);

        $this->hydrateTimelineEntries($entries, $viewer);

        // Inject ads every 6 posts
        $injectionInterval = config('ads.placements.'.AdPlacement::TimelineInline->value.'.injection_interval', 6);
        $data = $entries->items();
        $injectedData = [];
        $postCount = 0;

        foreach ($data as $entry) {
            $injectedData[] = $entry;
            $postCount++;

            // Inject ad every N posts
            if ($postCount % $injectionInterval === 0) {
                $adCreative = $this->adServingService->serve(
                    AdPlacement::TimelineInline,
                    $viewer,
                    [
                        'session_id' => $request->hasSession() ? $request->session()->getId() : null,
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                    ]
                );

                if ($adCreative !== null) {
                    // Record impression
                    $this->adServingService->recordImpression(
                        $adCreative,
                        AdPlacement::TimelineInline,
                        $viewer,
                        [
                            'session_id' => $request->hasSession() ? $request->session()->getId() : null,
                            'ip_address' => $request->ip(),
                            'user_agent' => $request->userAgent(),
                        ]
                    );

                    // Add ad as a special entry
                    $injectedData[] = [
                        'type' => 'ad',
                        'ad' => (new AdCreativeResource($adCreative))->toArray($request),
                    ];
                }
            }
        }

        // Create a new paginator with injected ads
        $injectedEntries = new \Illuminate\Pagination\LengthAwarePaginator(
            $injectedData,
            $entries->total(),
            $entries->perPage(),
            $entries->currentPage(),
            [
                'path' => $entries->path(),
                'pageName' => $pageName,
            ]
        );

        // Convert to array format
        $payload = ['data' => []];
        foreach ($injectedEntries->items() as $item) {
            if (isset($item['type']) && $item['type'] === 'ad') {
                $payload['data'][] = $item;
            } else {
                $payload['data'][] = (new TimelineEntryResource($item))->toArray($request);
            }
        }

        $payload['meta'] = [
            'current_page' => $injectedEntries->currentPage(),
            'from' => $injectedEntries->firstItem(),
            'last_page' => $injectedEntries->lastPage(),
            'per_page' => $injectedEntries->perPage(),
            'to' => $injectedEntries->lastItem(),
            'total' => $injectedEntries->total(),
            'has_more_pages' => $injectedEntries->hasMorePages(),
        ];

        return $payload;
    }

    public function getUserFeed(
        User $profile,
        ?User $viewer,
        int $page,
        int $perPage,
        Request $request,
        string $pageName = 'page',
    ): array {
        $posts = Post::query()
            ->forAuthor($profile)
            ->visibleTo($viewer)
            ->with([
                'author',
                'media',
                'poll.options',
                'hashtags',
            ])
            ->withCount(['bookmarks as bookmarks_count'])
            ->withBookmarkStateFor($viewer)
            ->latest('published_at')
            ->paginate(perPage: $perPage, page: $page, pageName: $pageName);

        $this->attachViewerState($viewer, $posts->getCollection());

        $payload = PostResource::collection($posts)
            ->toResponse($request)
            ->getData(true);

        if (isset($payload['meta'])) {
            $payload['meta']['has_more_pages'] = $posts->hasMorePages();
        }

        return $payload;
    }

    public function getCircleFeed(
        Circle $circle,
        ?User $viewer,
        int $page,
        int $perPage,
        Request $request,
        ?string $facetValue = null,
        string $pageName = 'page',
    ): array {
        return app(TimelineCacheService::class)->rememberCircleFeed(
            $circle,
            $viewer,
            $page,
            $perPage,
            function () use ($circle, $viewer, $page, $perPage, $pageName, $request, $facetValue) {
                $postsQuery = $circle->posts()
                    ->with([
                        'author' => static fn ($author) => $author->select('id', 'name', 'username', 'display_name', 'avatar_path', 'gender', 'role'),
                        'media',
                        'poll.options',
                        'hashtags',
                    ])
                    ->withCount(['bookmarks as bookmark_count'])
                    ->visibleTo($viewer);

                // Apply facet filtering if a facet is specified
                if ($facetValue !== null) {
                    $facet = $circle->facets()
                        ->where('value', $facetValue)
                        ->first();

                    if ($facet !== null && $facet->filters !== null) {
                        $filters = $facet->filters;

                        // Filter by gender if specified
                        if (isset($filters['gender']) && is_array($filters['gender']) && count($filters['gender']) > 0) {
                            $postsQuery->whereHas('author', function ($query) use ($filters): void {
                                $query->whereIn('gender', $filters['gender']);
                            });
                        }

                        // Filter by role range if specified
                        if (isset($filters['role_min']) || isset($filters['role_max'])) {
                            $postsQuery->whereHas('author', function ($query) use ($filters): void {
                                if (isset($filters['role_min'])) {
                                    $query->where('role', '>=', $filters['role_min']);
                                }
                                if (isset($filters['role_max'])) {
                                    $query->where('role', '<=', $filters['role_max']);
                                }
                            });
                        }
                    }
                }

                $posts = $postsQuery
                    ->latest('published_at')
                    ->paginate(perPage: $perPage, page: $page, pageName: $pageName)
                    ->withQueryString();

                $this->attachViewerState($viewer, $posts->getCollection());

                $payload = PostResource::collection($posts)
                    ->toResponse($request)
                    ->getData(true);

                if (isset($payload['meta'])) {
                    $payload['meta']['has_more_pages'] = $posts->hasMorePages();
                }

                return $payload;
            },
            $pageName,
            $facetValue,
        );
    }

    private function hydrateTimelineEntries(LengthAwarePaginator $entries, ?User $viewer): void
    {
        $posts = $entries->getCollection()
            ->filter(static fn ($entry) => $entry instanceof Timeline && $entry->post instanceof Post)
            ->map(static function (Timeline $timeline): Post {
                /** @var Post $post */
                $post = $timeline->post;
                $post->setRelation('timelineEntry', $timeline);

                return $post;
            })
            ->values();

        $this->attachViewerState($viewer, $posts);
    }

    private function attachViewerState(?User $viewer, iterable $posts): void
    {
        if ($viewer === null) {
            return;
        }

        $viewer->attachLikeStatus($posts);
        $viewer->attachBookmarkStatus($posts);
    }
}

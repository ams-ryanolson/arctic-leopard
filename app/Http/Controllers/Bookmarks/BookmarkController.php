<?php

namespace App\Http\Controllers\Bookmarks;

use App\Http\Controllers\Controller;
use App\Http\Resources\BookmarkResource;
use App\Models\Bookmark;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Inertia\ScrollMetadata;

class BookmarkController extends Controller
{
    private const PAGE_NAME = 'bookmarks';

    private const PER_PAGE = 20;

    public function index(Request $request): Response|JsonResponse
    {
        $user = $request->user();
        $page = max(1, (int) $request->input(self::PAGE_NAME, 1));

        $resolver = function () use ($request, $user, $page) {
            if ($user === null) {
                return [
                    'data' => [],
                    'links' => [],
                    'meta' => [
                        'current_page' => 1,
                        'last_page' => 1,
                        'per_page' => self::PER_PAGE,
                        'total' => 0,
                    ],
                ];
            }

            $bookmarks = Bookmark::query()
                ->where('user_id', $user->getKey())
                ->with([
                    'post' => static function ($query) use ($user): void {
                        $query->with([
                            'author',
                            'media',
                            'poll.options',
                            'hashtags',
                        ])
                            ->excludeBlockedFor($user)
                            ->withCount(['bookmarks as bookmarks_count'])
                            ->withBookmarkStateFor($user);
                    },
                ])
                ->latest('created_at')
                ->paginate(perPage: self::PER_PAGE, page: $page, pageName: self::PAGE_NAME);

            $posts = $bookmarks->getCollection()
                ->pluck('post')
                ->filter();

                $user->attachLikeStatus($posts);
                $user->attachBookmarkStatus($posts);

            return BookmarkResource::collection($bookmarks)
                ->toResponse($request)
                ->getData(true);
        };

        $bookmarks = Inertia::scroll(
            $resolver,
            metadata: static function (array $payload): ScrollMetadata {
                $current = (int) data_get($payload, 'meta.current_page', 1);
                $last = (int) data_get($payload, 'meta.last_page', $current);

                return new ScrollMetadata(
                    self::PAGE_NAME,
                    $current > 1 ? $current - 1 : null,
                    $current < $last ? $current + 1 : null,
                    $current,
                );
            },
        );

        if ($request->expectsJson()) {
            return response()->json($resolver());
        }

        return Inertia::render('Bookmarks/Index', [
            'bookmarks' => $bookmarks,
            'bookmarksPageName' => self::PAGE_NAME,
            'bookmarksPerPage' => self::PER_PAGE,
        ]);
    }
}

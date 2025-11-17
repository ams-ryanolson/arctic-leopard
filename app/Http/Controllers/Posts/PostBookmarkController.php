<?php

namespace App\Http\Controllers\Posts;

use App\Events\PostBookmarked;
use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Bookmark;
use App\Models\Post;
use App\Services\Cache\PostCacheService;
use App\Services\Cache\TimelineCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PostBookmarkController extends Controller
{
    public function __construct(
        private readonly PostCacheService $postCache,
        private readonly TimelineCacheService $timelineCache,
    ) {}

    public function store(Request $request, Post $post): JsonResponse
    {
        $this->authorize('bookmark', $post);

        $user = $request->user();

        $bookmark = Bookmark::query()->firstOrCreate([
            'user_id' => $user->getKey(),
            'post_id' => $post->getKey(),
        ]);

        if ($bookmark->wasRecentlyCreated) {
            $post->loadMissing('author');

            event(new PostBookmarked($user, $post));
        }

        $post->load([
            'author',
            'media',
            'poll.options',
            'hashtags',
        ])->loadCount([
            'bookmarks as bookmarks_count',
        ]);

        $user->attachBookmarkStatus($post);

        $this->postCache->forget($post);
        $this->timelineCache->forgetForUsers([
            $user,
            $post->author,
        ]);
        $this->timelineCache->forgetForPost($post);

        $response = (new PostResource($post))->toResponse($request);

        return $response->setStatusCode(
            $bookmark->wasRecentlyCreated ? Response::HTTP_CREATED : Response::HTTP_OK,
        );
    }

    public function destroy(Request $request, Post $post): JsonResponse
    {
        $this->authorize('bookmark', $post);

        $user = $request->user();

        $user->bookmarks()
            ->where('post_id', $post->getKey())
            ->first()?->delete();

        $post->load([
            'author',
            'media',
            'poll.options',
            'hashtags',
        ])->loadCount([
            'bookmarks as bookmarks_count',
        ]);

        $user->attachBookmarkStatus($post);

        $this->postCache->forget($post);
        $this->timelineCache->forgetForUsers([
            $user,
            $post->author,
        ]);
        $this->timelineCache->forgetForPost($post);

        return (new PostResource($post))->toResponse($request);
    }
}

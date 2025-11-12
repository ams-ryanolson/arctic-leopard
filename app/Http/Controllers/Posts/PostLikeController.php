<?php

namespace App\Http\Controllers\Posts;

use App\Events\PostLiked;
use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Post;
use App\Services\Cache\PostCacheService;
use App\Services\Cache\TimelineCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostLikeController extends Controller
{
    public function __construct(
        private readonly PostCacheService $postCache,
        private readonly TimelineCacheService $timelineCache,
    ) {
    }

    public function store(Request $request, Post $post): JsonResponse
    {
        $this->authorize('interact', $post);

        $user = $request->user();

        if (! $user->hasLiked($post)) {
            $user->like($post);
            $post->increment('likes_count');

            $post->loadMissing('author');

            event(new PostLiked($user, $post));
        }

        $post->load([
            'author',
            'media',
            'poll.options',
            'hashtags',
        ]);

        $user->attachLikeStatus($post);
        $user->attachBookmarkStatus($post);

        $this->postCache->forget($post);
        $this->timelineCache->forgetForUsers([
            $user,
            $post->author,
        ]);
        $this->timelineCache->forgetForPost($post);

        return (new PostResource($post))->toResponse($request);
    }

    public function destroy(Request $request, Post $post): JsonResponse
    {
        $this->authorize('interact', $post);

        $user = $request->user();

        if ($user->hasLiked($post)) {
            $user->unlike($post);

            if ($post->likes_count > 0) {
                $post->decrement('likes_count');
            }

            $post->load([
                'author',
                'media',
                'poll.options',
                'hashtags',
            ]);

            $user->attachLikeStatus($post);
            $user->attachBookmarkStatus($post);
        }

        $this->postCache->forget($post);
        $this->timelineCache->forgetForUsers([
            $user,
            $post->author,
        ]);
        $this->timelineCache->forgetForPost($post);

        return (new PostResource($post))->toResponse($request);
    }
}



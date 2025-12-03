<?php

namespace App\Http\Controllers\Posts;

use App\Http\Controllers\Controller;
use App\Http\Requests\Posts\StoreRepostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use App\Services\Cache\PostCacheService;
use App\Services\Cache\TimelineCacheService;
use App\Services\Posts\RepostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostRepostController extends Controller
{
    public function __construct(
        private readonly RepostService $repostService,
        private readonly PostCacheService $postCache,
        private readonly TimelineCacheService $timelineCache,
    ) {}

    public function store(StoreRepostRequest $request, Post $post): JsonResponse
    {
        $this->authorize('interact', $post);

        $user = $request->user();

        $amplifyPost = $this->repostService->amplify(
            $user,
            $post,
            $request->input('body')
        );

        $amplifyPost->load([
            'author',
            'media',
            'poll.options',
            'hashtags',
            'repostedPost.author',
            'repostedPost.media',
            'repostedPost.poll.options',
            'repostedPost.hashtags',
        ]);

        $amplifyPost->attachAmplifyStatusFor($user);
        $user->attachLikeStatus($amplifyPost);
        $user->attachBookmarkStatus($amplifyPost);

        // Return the original post so frontend can update it
        $originalPost = $amplifyPost->repostedPost;
        if ($originalPost) {
            $originalPost->load([
                'author',
                'media',
                'poll.options',
                'hashtags',
            ]);
            $originalPost->attachAmplifyStatusFor($user);
            $user->attachLikeStatus($originalPost);
            $user->attachBookmarkStatus($originalPost);
        }

        return (new PostResource($originalPost ?? $amplifyPost))->toResponse($request);
    }

    public function destroy(Request $request, Post $post): JsonResponse
    {
        $this->authorize('interact', $post);

        $user = $request->user();

        $this->repostService->unamplify($user, $post);

        $post->load([
            'author',
            'media',
            'poll.options',
            'hashtags',
        ]);

        $post->attachAmplifyStatusFor($user);
        $user->attachLikeStatus($post);
        $user->attachBookmarkStatus($post);

        return (new PostResource($post))->toResponse($request);
    }
}

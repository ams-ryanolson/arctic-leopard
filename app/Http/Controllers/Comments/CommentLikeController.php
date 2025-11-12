<?php

namespace App\Http\Controllers\Comments;

use App\Http\Controllers\Controller;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Post;
use App\Services\Cache\PostCacheService;
use App\Services\Cache\TimelineCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentLikeController extends Controller
{
    public function __construct(
        private PostCacheService $postCache,
        private TimelineCacheService $timelineCache,
    ) {
    }

    public function store(Request $request, Post $post, Comment $comment): JsonResponse
    {
        if ($comment->post_id !== $post->getKey()) {
            abort(404);
        }

        $this->authorize('like', $comment);

        $user = $request->user();

        if ($user === null) {
            abort(403);
        }

        if (! $user->hasLiked($comment)) {
            $user->like($comment);
            $comment->increment('likes_count');
        }

        $comment->refresh();
        $comment->load([
            'author',
            'replies' => function ($query): void {
                $query->withTrashed()
                    ->orderBy('created_at')
                    ->with('author');
            },
        ]);

        $user->attachLikeStatus($comment);
        $comment->replies->each(function (Comment $reply) use ($user): void {
            $user->attachLikeStatus($reply);
            $reply->replies->each(function (Comment $nested) use ($user): void {
                $user->attachLikeStatus($nested);
            });
        });

        $this->postCache->forget($post);
        $post->loadMissing('author');
        $this->timelineCache->forgetForUsers([
            $post->author,
            $user,
        ]);
        $this->timelineCache->forgetForPost($post);

        return (new CommentResource($comment))->toResponse($request);
    }

    public function destroy(Request $request, Post $post, Comment $comment): JsonResponse
    {
        if ($comment->post_id !== $post->getKey()) {
            abort(404);
        }

        $this->authorize('like', $comment);

        $user = $request->user();

        if ($user === null) {
            abort(403);
        }

        if ($user->hasLiked($comment)) {
            $user->unlike($comment);

            if ($comment->likes_count > 0) {
                $comment->decrement('likes_count');
            }
        }

        $comment->refresh();
        $comment->load([
            'author',
            'replies' => function ($query): void {
                $query->withTrashed()
                    ->orderBy('created_at')
                    ->with('author');
            },
        ]);

        $user->attachLikeStatus($comment);
        $comment->replies->each(function (Comment $reply) use ($user): void {
            $user->attachLikeStatus($reply);
            $reply->replies->each(function (Comment $nested) use ($user): void {
                $user->attachLikeStatus($nested);
            });
        });

        $this->postCache->forget($post);
        $post->loadMissing('author');
        $this->timelineCache->forgetForUsers([
            $post->author,
            $user,
        ]);
        $this->timelineCache->forgetForPost($post);

        return (new CommentResource($comment))->toResponse($request);
    }
}


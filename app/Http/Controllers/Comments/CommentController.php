<?php

namespace App\Http\Controllers\Comments;

use App\Http\Controllers\Controller;
use App\Http\Requests\Comments\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Post;
use App\Services\Cache\PostCacheService;
use App\Services\Cache\TimelineCacheService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class CommentController extends Controller
{
    public function __construct(
        private PostCacheService $postCache,
        private TimelineCacheService $timelineCache,
    ) {}

    public function index(Request $request, Post $post): JsonResponse
    {
        $this->authorize('view', $post);

        $comments = $post->comments()
            ->withTrashed()
            ->with([
                'author',
                'replies' => function ($query): void {
                    $query->withTrashed()
                        ->orderBy('created_at')
                        ->with([
                            'author',
                            'replies' => function ($nested): void {
                                $nested->withTrashed()
                                    ->orderBy('created_at')
                                    ->with('author');
                            },
                        ]);
                },
            ])
            ->whereNull('parent_id')
            ->latest('created_at')
            ->paginate(20);

        $user = $request->user();

        if ($user !== null) {
            $user->attachLikeStatus($comments);

            $comments->getCollection()->each(function (Comment $comment) use ($user): void {
                $user->attachLikeStatus($comment->replies);

                $comment->replies->each(function (Comment $reply) use ($user): void {
                    $user->attachLikeStatus($reply->replies);
                });
            });
        }

        return CommentResource::collection($comments)->toResponse($request);
    }

    public function store(StoreCommentRequest $request, Post $post): JsonResponse
    {
        $user = $request->user();
        $parent = null;
        $parentId = $request->input('parent_id');

        if ($parentId !== null) {
            $parent = $post->comments()
                ->whereKey($parentId)
                ->first();

            if ($parent === null) {
                abort(404);
            }

            if ($parent->depth >= 2) {
                abort(422, 'Maximum reply depth reached.');
            }

            $this->authorize('reply', $parent);
        }

        $depth = $parent !== null ? $parent->depth + 1 : 0;

        $comment = null;

        DB::transaction(function () use ($post, $user, $parent, $request, $depth, &$comment): void {
            $comment = $post->comments()->create([
                'user_id' => $user->getKey(),
                'parent_id' => $parent?->getKey(),
                'depth' => $depth,
                'body' => $request->input('body'),
                'is_pinned' => false,
                'likes_count' => 0,
                'replies_count' => 0,
            ]);

            $post->increment('comments_count');

            if ($parent !== null) {
                $parent->increment('replies_count');
            }
        });

        $comment->load(['author', 'replies.author']);

        $this->postCache->forget($post);
        $post->loadMissing('author');
        $this->timelineCache->forgetForUsers([
            $post->author,
            $user,
        ]);
        $this->timelineCache->forgetForPost($post);

        return (new CommentResource($comment))->toResponse($request)->setStatusCode(Response::HTTP_CREATED);
    }

    public function destroy(Request $request, Post $post, Comment $comment): JsonResponse
    {
        if ($comment->post_id !== $post->getKey()) {
            abort(404);
        }

        $this->authorize('delete', $comment);

        DB::transaction(function () use ($comment): void {
            $comment->delete();
        });

        $comment->refresh();
        $comment->load([
            'author',
            'replies' => function ($query): void {
                $query->withTrashed()
                    ->orderBy('created_at')
                    ->with('author');
            },
        ]);

        $user = $request->user();

        if ($user !== null) {
            $user->attachLikeStatus($comment);
            $comment->replies->each(function (Comment $reply) use ($user): void {
                $user->attachLikeStatus($reply);
                $reply->replies->each(function (Comment $nested) use ($user): void {
                    $user->attachLikeStatus($nested);
                });
            });
        }

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

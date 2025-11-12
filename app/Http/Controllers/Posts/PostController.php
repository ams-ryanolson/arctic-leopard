<?php

namespace App\Http\Controllers\Posts;

use App\Http\Controllers\Controller;
use App\Http\Requests\Posts\StorePostRequest;
use App\Http\Requests\Posts\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use App\Services\Cache\PostCacheService;
use App\Services\Cache\TimelineCacheService;
use App\Services\Posts\PostCreationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;

class PostController extends Controller
{
    public function __construct(
        protected PostCreationService $postCreationService,
        protected PostCacheService $postCache,
        protected TimelineCacheService $timelineCache,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $viewer = $request->user();
        $query = Post::query()
            ->with(['author', 'media', 'poll.options', 'hashtags'])
            ->visibleTo($viewer)
            ->withCount(['bookmarks as bookmarks_count'])
            ->withBookmarkStateFor($viewer)
            ->latest('published_at');

        if ($request->filled('author_id')) {
            $query->forAuthor($request->integer('author_id'));
        }

        $posts = $query->paginate(20);

        if ($viewer !== null) {
            $viewer->attachLikeStatus($posts);
            $viewer->attachBookmarkStatus($posts);
        }

        return PostResource::collection($posts)->toResponse($request);
    }

    public function store(StorePostRequest $request): JsonResponse|RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validated();

        $post = $this->postCreationService->create(
            $user,
            Arr::except($validated, ['media', 'poll', 'hashtags']),
            $validated['media'] ?? [],
            $validated['poll'] ?? null,
            $validated['hashtags'] ?? [],
        );

        $post->load(['author', 'media', 'poll.options', 'hashtags']);

        if ($request->expectsJson()) {
            return (new PostResource($post))
                ->toResponse($request)
                ->setStatusCode(Response::HTTP_CREATED);
        }

        return redirect()->route('dashboard');
    }

    public function show(Request $request, Post $post): JsonResponse
    {
        $this->authorize('view', $post);

        $payload = $this->postCache->remember($post, function () use ($post, $request) {
            $post->loadMissing(['author', 'media', 'poll.options', 'hashtags']);

            if ($request->user()) {
                $request->user()->attachLikeStatus($post);
                $request->user()->attachBookmarkStatus($post);
            }

            return (new PostResource($post))->toResponse($request)->getData(true);
        });

        return response()->json($payload);
    }

    public function update(UpdatePostRequest $request, Post $post): JsonResponse
    {
        $validated = $request->validated();

        $attributes = Arr::except($validated, ['media', 'poll', 'hashtags']);

        if ($attributes !== []) {
            $post->fill($attributes);
        }

        $post->save();

        if (array_key_exists('media', $validated)) {
            $post->media()->delete();
            $this->postCreationService->storeMedia($post, $validated['media'] ?? []);
        }

        if (array_key_exists('poll', $validated)) {
            $post->poll()->delete();

            if (! empty($validated['poll'])) {
                $this->postCreationService->storePoll($post, $validated['poll']);
            }
        }

        if (array_key_exists('hashtags', $validated)) {
            $this->postCreationService->syncHashtags($post, $validated['hashtags'] ?? [], true);
        }

        $post->load(['author', 'media', 'poll.options', 'hashtags']);

        if ($request->user()) {
            $request->user()->attachBookmarkStatus($post);
        }

        $this->postCache->forget($post);
        $this->timelineCache->forgetForUser($post->author);
        $this->timelineCache->forgetForPost($post);

        return (new PostResource($post))->toResponse($request);
    }

    public function destroy(Request $request, Post $post): Response
    {
        $this->authorize('delete', $post);

        $post->delete();

        $this->postCache->forget($post);
        $this->timelineCache->forgetForUser($post->author);
        $this->timelineCache->forgetForPost($post);

        return response()->noContent();
    }
}

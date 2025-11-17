<?php

namespace App\Http\Controllers\Stories;

use App\Http\Controllers\Controller;
use App\Http\Requests\Stories\StoreStoryRequest;
use App\Http\Resources\Stories\StoryResource;
use App\Models\Story;
use App\Models\User;
use App\Services\Stories\StoryReactionService;
use App\Services\Stories\StoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;

class StoryController extends Controller
{
    public function __construct(
        private StoryService $storyService,
        private StoryReactionService $storyReactionService,
    ) {}

    /**
     * Get stories for dashboard.
     */
    public function index(Request $request): JsonResponse
    {
        $viewer = $request->user();

        $stories = $this->storyService->getStoriesForDashboard($viewer);

        return response()->json([
            'data' => $stories,
        ]);
    }

    /**
     * Create a new story.
     */
    public function store(StoreStoryRequest $request): JsonResponse|RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validated();

        $story = $this->storyService->createStory($user, $validated);

        $story->load(['user', 'media']);

        // Check if this is an Inertia request (has X-Inertia header)
        if ($request->header('X-Inertia')) {
            return redirect()->route('dashboard')->with('success', 'Story created successfully!');
        }

        // For API/JSON requests
        if ($request->expectsJson() || $request->wantsJson()) {
            return (new StoryResource($story))
                ->toResponse($request)
                ->setStatusCode(Response::HTTP_CREATED);
        }

        // Default to redirect for web requests
        return redirect()->route('dashboard')->with('success', 'Story created successfully!');
    }

    /**
     * View a single story.
     */
    public function show(Request $request, Story $story)
    {
        // Load user relationship before authorization check
        $story->load('user');

        $this->authorize('view', $story);

        $viewer = $request->user();

        // Mark as viewed if viewer is authenticated
        if ($viewer !== null) {
            $this->storyService->markAsViewed($story, $viewer);
        }

        $story->load(['user', 'media', 'reactions.user']);

        // Get all stories the viewer can see (same logic as dashboard)
        $allStories = $this->storyService->getStoriesForDashboard($viewer);

        // Build a flat array of all story IDs in order (oldest to newest per user, then next user)
        // This matches Instagram's behavior: oldest story first, then newer ones
        $storyIds = [];
        foreach ($allStories as $userStories) {
            // Get all stories for this user (already ordered oldest to newest by getUserStories)
            $userStoriesCollection = $this->storyService->getUserStories(
                User::find($userStories['id']),
                $viewer
            );
            foreach ($userStoriesCollection as $s) {
                $storyIds[] = $s->getKey();
            }
        }

        // If current story isn't in the list, add all stories from current story's user
        if (! in_array($story->getKey(), $storyIds)) {
            $currentUserStories = $this->storyService->getUserStories($story->user, $viewer);
            $currentUserStoryIds = $currentUserStories->pluck('id')->toArray();

            // Find where to insert based on user order in allStories
            $insertPosition = 0;
            foreach ($allStories as $userStories) {
                if ($userStories['id'] === $story->user_id) {
                    // Insert at this position
                    break;
                }
                // Count stories from previous users
                $prevUserStories = $this->storyService->getUserStories(
                    User::find($userStories['id']),
                    $viewer
                );
                $insertPosition += $prevUserStories->count();
            }

            // Insert all stories from current user
            foreach ($currentUserStoryIds as $sid) {
                if (! in_array($sid, $storyIds)) {
                    array_splice($storyIds, $insertPosition, 0, $sid);
                    $insertPosition++;
                }
            }
        }

        // Find current story index
        $currentIndex = array_search($story->getKey(), $storyIds);

        // Get next and previous story IDs
        $nextStoryId = null;
        $previousStoryId = null;

        if ($currentIndex !== false) {
            // Next story = newer story (index + 1) or next user's first story
            if (isset($storyIds[$currentIndex + 1])) {
                $nextStoryId = $storyIds[$currentIndex + 1];
            }

            // Previous story = older story (index - 1) or previous user's last story
            if ($currentIndex > 0 && isset($storyIds[$currentIndex - 1])) {
                $previousStoryId = $storyIds[$currentIndex - 1];
            }
        }

        if ($request->expectsJson()) {
            // Attach viewer's reaction state
            if ($viewer !== null) {
                $viewerReactions = $story->reactions()
                    ->where('user_id', $viewer->getKey())
                    ->pluck('emoji')
                    ->toArray();

                $story->setAttribute('viewer_reactions', $viewerReactions);
            }

            $response = (new StoryResource($story))->toResponse($request);
            $responseData = $response->getData(true);

            // Add navigation IDs to the response
            $responseData['nextStoryId'] = $nextStoryId;
            $responseData['previousStoryId'] = $previousStoryId;

            return response()->json($responseData);
        }

        $storyResource = new StoryResource($story);

        return Inertia::render('Stories/Show', [
            'story' => $storyResource->resolve($request),
            'nextStoryId' => $nextStoryId,
            'previousStoryId' => $previousStoryId,
        ]);
    }

    /**
     * Delete a story.
     */
    public function destroy(Story $story): JsonResponse
    {
        $this->authorize('delete', $story);

        $this->storyService->deleteStory($story);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Mark a story as viewed.
     */
    public function markAsViewed(Request $request, Story $story): JsonResponse
    {
        $viewer = $request->user();

        if ($viewer === null) {
            return response()->json(['message' => 'Unauthenticated.'], Response::HTTP_UNAUTHORIZED);
        }

        $this->storyService->markAsViewed($story, $viewer);

        return response()->json(['message' => 'Story marked as viewed.']);
    }

    /**
     * Get analytics for a story.
     */
    public function analytics(Story $story): JsonResponse
    {
        $this->authorize('viewAnalytics', $story);

        $analytics = [
            'views_count' => $story->views_count,
            'reactions_count' => $story->reactions_count,
            'reactions' => $this->storyReactionService->getReactions($story),
            'published_at' => $story->published_at?->toIso8601String(),
            'expires_at' => $story->expires_at?->toIso8601String(),
            'is_expired' => $story->isExpired(),
        ];

        return response()->json($analytics);
    }
}

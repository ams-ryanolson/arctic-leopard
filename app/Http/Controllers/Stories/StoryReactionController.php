<?php

namespace App\Http\Controllers\Stories;

use App\Http\Controllers\Controller;
use App\Models\Story;
use App\Models\StoryReaction;
use App\Services\Stories\StoryReactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class StoryReactionController extends Controller
{
    public function __construct(
        private StoryReactionService $storyReactionService,
    ) {}

    /**
     * Toggle a reaction on a story.
     */
    public function store(Request $request, Story $story): JsonResponse
    {
        // Load user relationship before authorization check
        $story->load('user');

        $this->authorize('view', $story);

        $validated = $request->validate([
            'emoji' => [
                'required',
                'string',
                'max:10',
                Rule::in(config('stories.allowed_reactions', ['❤️', '🔥', '👍', '😍', '😮'])),
            ],
        ]);

        $user = $request->user();

        if ($user === null) {
            return response()->json(['message' => 'Unauthenticated.'], Response::HTTP_UNAUTHORIZED);
        }

        $reactions = $this->storyReactionService->toggle($user, $story, $validated['emoji']);

        $story->refresh();

        return response()->json([
            'reactions' => $reactions,
            'reactions_count' => $story->reactions_count,
        ]);
    }

    /**
     * Remove a specific reaction.
     */
    public function destroy(Request $request, Story $story, StoryReaction $reaction): JsonResponse
    {
        // Verify the reaction belongs to the story
        if ($reaction->story_id !== $story->getKey()) {
            abort(404);
        }

        $user = $request->user();

        // Verify the user owns the reaction
        if ($user === null || $reaction->user_id !== $user->getKey()) {
            abort(403);
        }

        $reaction->delete();

        if ($story->reactions_count > 0) {
            $story->decrementReactionsCount();
        }

        return response()->json(['message' => 'Reaction removed.']);
    }
}

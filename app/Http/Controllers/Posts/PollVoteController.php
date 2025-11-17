<?php

namespace App\Http\Controllers\Posts;

use App\Http\Controllers\Controller;
use App\Http\Requests\Polls\StorePollVoteRequest;
use App\Http\Resources\PostResource;
use App\Models\PostPoll;
use App\Models\PostPollVote;
use App\Services\Polls\PollVoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PollVoteController extends Controller
{
    public function __construct(protected PollVoteService $pollVoteService) {}

    public function store(StorePollVoteRequest $request, PostPoll $poll): JsonResponse
    {
        $option = $poll->options()->findOrFail($request->integer('option_id'));

        $vote = $this->pollVoteService->vote(
            $poll,
            $option,
            $request->user(),
            [
                'ip_address' => $request->input('ip_address'),
                'meta' => $request->input('meta', []),
            ]
        );

        $post = $poll->post?->fresh(['author', 'media', 'poll.options', 'hashtags']);

        if ($post === null) {
            abort(500, 'Poll is missing parent post.');
        }

        return (new PostResource($post))->toResponse($request);
    }

    public function destroy(Request $request, PostPoll $poll, PostPollVote $vote): Response
    {
        if ($vote->post_poll_id !== $poll->getKey()) {
            abort(404);
        }

        $this->authorize('delete', $vote);

        $this->pollVoteService->retract($vote, $request->user());

        return response()->noContent();
    }
}

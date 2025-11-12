<?php

namespace App\Http\Controllers\Messaging;

use App\Http\Controllers\Controller;
use App\Http\Requests\Messaging\AddConversationParticipantsRequest;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Models\User;
use App\Services\Messaging\ConversationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ConversationParticipantController extends Controller
{
    public function __construct(
        private ConversationService $conversations,
    ) {}

    public function store(AddConversationParticipantsRequest $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('addParticipants', $conversation);

        $conversation = $this->conversations->addParticipants(
            $conversation,
            $request->user(),
            $request->participantIds(),
        );

        return (new ConversationResource($conversation))->toResponse($request);
    }

    public function destroy(Request $request, Conversation $conversation, User $user): Response
    {
        if ($request->user()?->is($user)) {
            $this->authorize('leave', $conversation);
        } else {
            $this->authorize('removeParticipants', $conversation);
        }

        $this->conversations->leaveConversation($conversation, $user);

        return response()->noContent();
    }
}

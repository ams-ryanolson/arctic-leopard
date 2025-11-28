<?php

namespace App\Http\Controllers\Messaging;

use App\Http\Controllers\Controller;
use App\Http\Requests\Messaging\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\Messaging\MessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ConversationMessageController extends Controller
{
    public function __construct(
        private MessageService $messages,
    ) {}

    public function index(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        $perPage = min($request->integer('per_page', 50), 100);
        $beforeId = $request->input('before');

        $query = $conversation->messages()
            ->select(['id', 'ulid', 'conversation_id', 'user_id', 'reply_to_id', 'type', 'sequence', 'body', 'fragments', 'metadata', 'visible_at', 'edited_at', 'redacted_at', 'undo_expires_at', 'deleted_at', 'created_at', 'updated_at'])
            ->with(['author:id,name,username,display_name,avatar_url', 'attachments', 'reactions'])
            ->orderByDesc('sequence');

        if ($beforeId) {
            $pivotSequence = Message::query()
                ->where('conversation_id', $conversation->getKey())
                ->where('id', $beforeId)
                ->value('sequence');

            if ($pivotSequence === null) {
                abort(Response::HTTP_NOT_FOUND, 'Message not found.');
            }

            $query->where('sequence', '<', $pivotSequence);
        }

        $messages = $query->take($perPage + 1)->get();

        $hasMore = $messages->count() > $perPage;
        $messages = $messages->take($perPage)->sortBy('sequence')->values();

        return response()->json([
            'data' => MessageResource::collection($messages)->resolve(),
            'meta' => [
                'has_more' => $hasMore,
                'oldest_id' => $messages->first()?->getKey(),
            ],
        ]);
    }

    public function store(StoreMessageRequest $request, Conversation $conversation): JsonResponse
    {
        $payload = $request->payload();

        if (! empty($payload['reply_to_id'])) {
            $replyMessage = Message::query()->findOrFail($payload['reply_to_id']);

            abort_unless(
                (int) $replyMessage->conversation_id === (int) $conversation->getKey(),
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'Reply target must belong to the same conversation.',
            );
        }

        $message = $this->messages->sendMessage(
            $request->user(),
            $conversation,
            $payload,
        );

        return (new MessageResource($message))
            ->toResponse($request)
            ->setStatusCode(Response::HTTP_CREATED);
    }
}

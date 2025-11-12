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
            ->with(['author', 'attachments', 'reactions'])
            ->orderByDesc('sequence');

        if ($beforeId) {
            $pivot = Message::query()
                ->where('conversation_id', $conversation->getKey())
                ->findOrFail($beforeId);

            $query->where('sequence', '<', $pivot->sequence);
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

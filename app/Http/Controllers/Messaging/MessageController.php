<?php

namespace App\Http\Controllers\Messaging;

use App\Http\Controllers\Controller;
use App\Http\Resources\MessageResource;
use App\Models\Message;
use App\Services\Messaging\MessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class MessageController extends Controller
{
    public function __construct(
        private MessageService $messages,
    ) {}

    public function destroy(Request $request, Message $message): Response
    {
        $this->authorize('delete', $message);

        $this->messages->deleteMessage($request->user(), $message);

        return response()->noContent();
    }

    public function undo(Request $request, Message $message): JsonResponse
    {
        $this->authorize('undo', $message);

        $message = $this->messages->undoDeletion($request->user(), $message);

        return (new MessageResource($message))->toResponse($request);
    }

    public function thread(Request $request, Message $message): JsonResponse
    {
        $this->authorize('view', $message);

        $context = $this->messages->threadContext($message, $request->integer('limit', 3));
        $context->load(['author', 'attachments', 'reactions']);

        $payload = [
            'message' => new MessageResource($message->loadMissing(['author', 'attachments', 'reactions'])),
            'context' => MessageResource::collection($context),
        ];

        return response()->json($payload);
    }
}

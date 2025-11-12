<?php

namespace App\Http\Controllers\Messaging;

use App\Http\Controllers\Controller;
use App\Http\Requests\Messaging\StoreReactionRequest;
use App\Http\Resources\MessageResource;
use App\Models\Message;
use App\Services\Messaging\MessageReactionService;
use Illuminate\Http\JsonResponse;

class MessageReactionController extends Controller
{
    public function __construct(
        private MessageReactionService $reactions,
    ) {}

    public function store(StoreReactionRequest $request, Message $message): JsonResponse
    {
        $summary = $this->reactions->toggle(
            $request->user(),
            $message,
            $request->validated('emoji'),
            $request->validated('variant'),
        );

        return response()->json([
            'message' => new MessageResource($message->fresh(['author', 'attachments', 'reactions'])),
            'reactions' => $summary,
        ]);
    }
}

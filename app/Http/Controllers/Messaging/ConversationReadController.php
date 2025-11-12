<?php

namespace App\Http\Controllers\Messaging;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Services\Messaging\ConversationService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ConversationReadController extends Controller
{
    public function __construct(
        private ConversationService $conversations,
    ) {}

    public function __invoke(Request $request, Conversation $conversation): Response
    {
        $this->authorize('view', $conversation);

        $messageId = $request->integer('message_id');
        $message = $messageId ? Message::query()->find($messageId) : null;

        if ($message instanceof Message && (int) $message->conversation_id !== (int) $conversation->getKey()) {
            $message = null;
        }

        $this->conversations->markRead($conversation, $request->user(), $message);

        return response()->noContent();
    }
}

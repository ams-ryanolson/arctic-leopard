<?php

namespace App\Http\Controllers\Messaging;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Services\Messaging\ConversationPresenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationPresenceController extends Controller
{
    public function __construct(
        private ConversationPresenceService $presence,
    ) {}

    public function heartbeat(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        $user = $request->user();

        $this->presence->heartbeat($conversation, $user);

        return response()->json([
            'online' => $this->presence->online($conversation),
        ]);
    }

    public function typing(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        $validated = $request->validate([
            'is_typing' => ['required', 'boolean'],
        ]);

        $this->presence->setTyping($conversation, $request->user(), (bool) $validated['is_typing']);

        return response()->json([
            'typing' => $this->presence->typing($conversation),
        ]);
    }
}

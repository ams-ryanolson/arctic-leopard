<?php

namespace App\Http\Controllers\Messaging;

use App\Http\Controllers\Controller;
use App\Http\Requests\Messaging\StoreConversationRequest;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Models\User;
use App\Services\Messaging\ConversationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ConversationController extends Controller
{
    public function __construct(
        private ConversationService $conversations,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Conversation::class);

        $user = $request->user();
        $perPage = min($request->integer('per_page', 20), 50);

        $query = Conversation::query()
            ->with([
                'participants.user',
                'lastMessage.author',
            ])
            ->whereHas('participants', fn ($participants) => $participants
                ->where('user_id', $user?->getKey())
                ->whereNull('left_at'))
            ->latest('last_message_at')
            ->latest('updated_at');

        $paginator = $query->paginate($perPage);

        return ConversationResource::collection($paginator)->toResponse($request);
    }

    public function store(StoreConversationRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validated();
        $type = $validated['type'];
        $conversation = null;

        if ($type === 'direct') {
            $recipientId = (int) $validated['recipient_id'];
            $recipient = User::query()->findOrFail($recipientId);

            $conversation = $this->conversations->startDirectConversation($user, $recipient, $validated);
        } else {
            $conversation = $this->conversations->startGroupConversation($user, $request->participantIds(), $validated);
        }

        $conversation->load(['participants.user', 'lastMessage.author']);

        return (new ConversationResource($conversation))
            ->toResponse($request)
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('view', $conversation);

        $conversation->load(['participants.user', 'lastMessage.author']);

        return (new ConversationResource($conversation))->toResponse($request);
    }
}

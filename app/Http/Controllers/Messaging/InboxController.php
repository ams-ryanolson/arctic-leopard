<?php

namespace App\Http\Controllers\Messaging;

use App\Http\Controllers\Controller;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\User;
use App\Services\Messaging\ConversationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class InboxController extends Controller
{
    public function __construct(
        private ConversationService $conversations,
    ) {}

    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $requestedConversationId = $request->integer('conversation') ?? $request->input('conversation');
        $composeHandle = trim((string) $request->query('compose', ''));

        if ($composeHandle !== '') {
            $normalizedHandle = ltrim($composeHandle, '@');
            $recipientQuery = User::query()
                ->where('id', '!=', $user->getKey())
                ->where(function ($query) use ($normalizedHandle): void {
                    $lower = Str::lower($normalizedHandle);
                    $query->where('username', $normalizedHandle)
                        ->orWhere('username_lower', $lower);
                });

            $recipient = $recipientQuery->first();

            if ($recipient instanceof User) {
                try {
                    $conversation = $this->conversations->startDirectConversation($user, $recipient);
                    $requestedConversationId = $conversation->getKey();
                } catch (AuthorizationException) {
                    // User cannot start a conversation (blocked, etc.); ignore.
                }
            }
        }

        $participantRecords = ConversationParticipant::query()
            ->select('conversation_participants.*')
            ->with([
                'conversation.lastMessage.author',
                'conversation.participants' => fn ($query) => $query
                    ->whereNull('left_at')
                    ->with('user'),
                'lastReadMessage',
            ])
            ->leftJoin('conversations', 'conversations.id', '=', 'conversation_participants.conversation_id')
            ->where('conversation_participants.user_id', $user->getKey())
            ->whereNull('conversation_participants.left_at')
            ->orderByDesc('conversations.last_message_at')
            ->orderByDesc('conversations.updated_at')
            ->get();

        $threads = $participantRecords->map(fn (ConversationParticipant $participant) => $this->formatThread($participant, $user));

        $firstThreadId = $threads->first()['id'] ?? null;
        $activeConversationId = $requestedConversationId ?? $firstThreadId;

        $activeConversationData = null;
        $activeMessages = [];
        $messageMeta = [
            'has_more' => false,
        ];

        if ($activeConversationId !== null) {
            $activeConversation = Conversation::query()
                ->with([
                    'participants' => fn ($query) => $query
                        ->whereNull('left_at')
                        ->with('user'),
                    'lastMessage.author',
                ])
                ->find($activeConversationId);

            if (! $activeConversation instanceof Conversation) {
                $activeConversationId = $firstThreadId;

                if ($activeConversationId === null) {
                    $activeConversation = null;
                } else {
                    $activeConversation = Conversation::query()
                        ->with([
                            'participants' => fn ($query) => $query
                                ->whereNull('left_at')
                                ->with('user'),
                            'lastMessage.author',
                        ])
                        ->find($activeConversationId);
                }
            }

            if ($activeConversation instanceof Conversation) {
                $messagesQuery = $activeConversation->messages()
                    ->with(['author', 'attachments', 'reactions'])
                    ->orderByDesc('sequence');

                $messages = $messagesQuery->take(41)->get();
                $hasMore = $messages->count() > 40;
                $messages = $messages->take(40)->sortBy('sequence')->values();

                $activeMessages = MessageResource::collection($messages)->resolve();
                $messageMeta['has_more'] = $hasMore;
                $messageMeta['oldest_id'] = $messages->first()?->getKey();

                $activeConversationData = $this->formatActiveConversation($activeConversation, $user);
            }
        }

        return Inertia::render('Messages/Index', [
            'threads' => $threads,
            'activeConversation' => $activeConversationData,
            'messages' => $activeMessages,
            'messagesMeta' => $messageMeta,
            'viewer' => [
                'id' => $user->getKey(),
                'display_name' => $user->display_name ?? $user->name ?? $user->username,
                'avatar_url' => $user->avatar_url,
                'username' => $user->username,
            ],
        ]);
    }

    protected function formatThread(ConversationParticipant $participant, User $viewer): array
    {
        $conversation = $participant->conversation;
        $lastMessage = $conversation->lastMessage;
        $otherParticipants = $conversation->participants
            ->where('user_id', '!=', $viewer->getKey())
            ->values();

        $title = $conversation->subject
            ?? $otherParticipants->pluck('user.display_name')->filter()->implode(', ')
            ?: ($otherParticipants->pluck('user.username')->filter()->implode(', ') ?: 'Conversation');

        $lastReadSequence = $participant->lastReadMessage?->sequence ?? 0;
        $unreadCount = max(0, (int) $conversation->message_count - $lastReadSequence);

        return [
            'id' => $conversation->getKey(),
            'title' => $title,
            'subject' => $conversation->subject,
            'is_group' => $conversation->isGroup(),
            'last_message' => $lastMessage ? MessageResource::make($lastMessage)->resolve() : null,
            'last_message_at' => optional($lastMessage?->created_at ?? $conversation->updated_at)->toIso8601String(),
            'unread_count' => $unreadCount,
            'participants' => $conversation->participants->map(fn (ConversationParticipant $member) => [
                'id' => $member->user_id,
                'display_name' => $member->user?->display_name ?? $member->user?->username,
                'avatar_url' => $member->user?->avatar_url,
                'is_viewer' => (int) $member->user_id === (int) $viewer->getKey(),
            ])->values(),
        ];
    }

    protected function formatActiveConversation(Conversation $conversation, User $viewer): array
    {
        $otherParticipants = $conversation->participants
            ->where('user_id', '!=', $viewer->getKey())
            ->values();

        return [
            'id' => $conversation->getKey(),
            'title' => $conversation->subject
                ?? $otherParticipants->pluck('user.display_name')->filter()->implode(', ')
                ?: ($otherParticipants->pluck('user.username')->filter()->implode(', ') ?: 'Conversation'),
            'subject' => $conversation->subject,
            'is_group' => $conversation->isGroup(),
            'participants' => $conversation->participants->map(fn (ConversationParticipant $member) => [
                'id' => $member->user_id,
                'display_name' => $member->user?->display_name ?? $member->user?->username,
                'username' => $member->user?->username,
                'avatar_url' => $member->user?->avatar_url,
                'is_viewer' => (int) $member->user_id === (int) $viewer->getKey(),
            ])->values(),
        ];
    }
}

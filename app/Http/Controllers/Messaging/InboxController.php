<?php

namespace App\Http\Controllers\Messaging;

use App\Http\Controllers\Controller;
use App\Http\Requests\Messaging\UpdateMessagingSettingsRequest;
use App\Http\Resources\MessageResource;
use App\Models\AdminSetting;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\User;
use App\Services\Messaging\ConversationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class InboxController extends Controller
{
    public function __construct(
        private ConversationService $conversations,
    ) {}

    public function __invoke(Request $request, ?Conversation $conversation = null): Response|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $composeHandle = trim((string) $request->query('compose', ''));

        // Handle compose flow: find/create conversation and redirect to ULID URL
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
                    $composedConversation = $this->conversations->startDirectConversation($user, $recipient);

                    // Redirect to clean URL with ULID
                    return redirect()->route('messages.show', ['conversation' => $composedConversation->ulid]);
                } catch (AuthorizationException) {
                    // User cannot start a conversation (blocked, etc.); redirect to list
                    return redirect()->route('messages.index');
                }
            }
        }

        // Use route-bound conversation if available, otherwise fall back to query param (backward compat during transition)
        $requestedConversation = $conversation;
        $requestedConversationId = $requestedConversation?->getKey() ?? $request->integer('conversation');

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

        // Only set active conversation if explicitly requested via route (ULID) or query param (backward compat)
        // Don't auto-select first thread - let user choose
        $activeConversationId = $requestedConversationId;

        $activeConversationData = null;
        $activeMessages = [];
        $messageMeta = [
            'has_more' => false,
        ];

        if ($activeConversationId !== null) {
            // Use route-bound conversation if available, otherwise find by ID
            $activeConversation = $requestedConversation;

            // Load relationships if we have a route-bound conversation
            if ($activeConversation instanceof Conversation && ! $activeConversation->relationLoaded('participants')) {
                $activeConversation->load([
                    'participants' => fn ($query) => $query
                        ->whereNull('left_at')
                        ->with('user'),
                    'lastMessage.author',
                ]);
            }

            if (! $activeConversation instanceof Conversation) {
                $activeConversation = Conversation::query()
                    ->with([
                        'participants' => fn ($query) => $query
                            ->whereNull('left_at')
                            ->with('user'),
                        'lastMessage.author',
                    ])
                    ->find($activeConversationId);
            }

            if (! $activeConversation instanceof Conversation) {
                // Conversation not found - don't show any active conversation
                $activeConversation = null;
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

    public function settings(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

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

        // Load user's messaging preferences (or get defaults)
        $preferences = $user->getMessagingPreferences();

        return Inertia::render('Messages/Index', [
            'threads' => $threads,
            'activeConversation' => null,
            'messages' => [],
            'messagesMeta' => ['has_more' => false],
            'showSettings' => true,
            'messagingPreferences' => [
                'message_request_mode' => $preferences->message_request_mode,
                'allow_subscriber_messages' => $preferences->allow_subscriber_messages,
                'filter_low_quality' => $preferences->filter_low_quality,
            ],
            'viewer' => [
                'id' => $user->getKey(),
                'display_name' => $user->display_name ?? $user->name ?? $user->username,
                'avatar_url' => $user->avatar_url,
                'username' => $user->username,
            ],
        ]);
    }

    public function updateSettings(UpdateMessagingSettingsRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        // Get or create user's messaging preferences
        $preferences = $user->getMessagingPreferences();

        // Prepare update data
        $updateData = [
            'message_request_mode' => $request->validated('message_request_mode'),
            'filter_low_quality' => $request->validated('filter_low_quality', false),
        ];

        // Only update allow_subscriber_messages if Signals feature is enabled
        $signalsEnabled = (bool) AdminSetting::get('feature_signals_enabled', false);
        if ($signalsEnabled) {
            $updateData['allow_subscriber_messages'] = $request->validated('allow_subscriber_messages', true);
        }

        // Update preferences
        $preferences->update($updateData);

        return redirect()->route('messages.settings')->with('success', 'Your messaging preferences have been updated.');
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
            'ulid' => $conversation->ulid,
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
            'ulid' => $conversation->ulid,
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

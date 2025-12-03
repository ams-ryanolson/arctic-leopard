<?php

use App\Events\Messaging\MessageSent;
use App\Events\Toasts\ToastPushed;
use App\Models\Conversation;
use App\Models\User;
use App\Services\Messaging\ConversationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

use function Pest\Laravel\actingAs;

uses(RefreshDatabase::class);

function realtimeUser(array $attributes = []): User
{
    return User::factory()->create(array_merge([
        'profile_completed_at' => now(),
    ], $attributes));
}

function realtimeConversation(User $a, User $b): Conversation
{
    /** @var ConversationService $service */
    $service = app(ConversationService::class);

    return $service->startDirectConversation($a, $b);
}

it('broadcasts message events and pushes toast notifications', function (): void {
    Event::fake([MessageSent::class, ToastPushed::class]);

    $sender = realtimeUser();
    $recipient = realtimeUser();
    $conversation = realtimeConversation($sender, $recipient);

    actingAs($sender)->postJson("/api/conversations/{$conversation->ulid}/messages", [
        'body' => 'Realtime hello',
    ])->assertCreated();

    Event::assertDispatched(MessageSent::class, function (MessageSent $event) use ($conversation, $sender): bool {
        return (int) $event->message->conversation_id === (int) $conversation->id
            && (int) $event->message->user_id === (int) $sender->getKey();
    });

    Event::assertDispatched(ToastPushed::class, function (ToastPushed $event) use ($recipient): bool {
        return $event->user->is($recipient)
            && $event->payload->category === 'messaging';
    });
});

it('records presence heartbeat and typing signals', function (): void {
    $user = realtimeUser();
    $other = realtimeUser();
    $conversation = realtimeConversation($user, $other);

    actingAs($user)
        ->postJson("/api/conversations/{$conversation->ulid}/presence/heartbeat")
        ->assertOk()
        ->assertJsonCount(1, 'online');

    actingAs($user)
        ->postJson("/api/conversations/{$conversation->ulid}/presence/typing", [
            'is_typing' => true,
        ])
        ->assertOk()
        ->assertJsonCount(1, 'typing');
});

<?php

use App\Models\Conversation;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use App\Services\Messaging\ConversationService;
use App\Services\TemporaryUploadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use function Pest\Laravel\actingAs;

uses(RefreshDatabase::class);

function messagingUser(array $attributes = []): User
{
    return User::factory()->create(array_merge([
        'profile_completed_at' => now(),
    ], $attributes));
}

function makeDirectConversation(User $a, User $b): Conversation
{
    /** @var ConversationService $service */
    $service = app(ConversationService::class);

    return $service->startDirectConversation($a, $b);
}

it('sends a message within a conversation', function (): void {
    $sender = messagingUser();
    $recipient = messagingUser();
    $conversation = makeDirectConversation($sender, $recipient);

    $response = actingAs($sender)->postJson("/api/conversations/{$conversation->getKey()}/messages", [
        'body' => 'Hello world',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.body', 'Hello world');

    $conversation->refresh();

    expect($conversation->message_count)->toBe(1)
        ->and($conversation->last_message_id)->not->toBeNull();
});

it('blocks messaging when another participant has blocked the sender', function (): void {
    $sender = messagingUser();
    $recipient = messagingUser();
    $conversation = makeDirectConversation($sender, $recipient);

    $recipient->blocks()->create([
        'blocked_id' => $sender->getKey(),
    ]);

    actingAs($sender)
        ->postJson("/api/conversations/{$conversation->getKey()}/messages", [
            'body' => 'Hi there',
        ])
        ->assertForbidden();
});

it('deletes and undoes a message', function (): void {
    $sender = messagingUser();
    $recipient = messagingUser();
    $conversation = makeDirectConversation($sender, $recipient);

    $messageResponse = actingAs($sender)->postJson("/api/conversations/{$conversation->getKey()}/messages", [
        'body' => 'Will remove',
    ])->assertCreated();

    $messageId = $messageResponse->json('data.id');

    actingAs($sender)
        ->deleteJson("/api/messages/{$messageId}")
        ->assertNoContent();

    $deleted = Message::withTrashed()->find($messageId);

    expect($deleted)
        ->not->toBeNull()
        ->and($deleted->deleted_at)->not->toBeNull();

    actingAs($sender)
        ->postJson("/api/messages/{$messageId}/undo")
        ->assertOk()
        ->assertJsonPath('data.deleted_at', null);
});

it('returns thread context for reply chains', function (): void {
    $sender = messagingUser();
    $recipient = messagingUser();
    $conversation = makeDirectConversation($sender, $recipient);

    $initial = actingAs($sender)->postJson("/api/conversations/{$conversation->getKey()}/messages", [
        'body' => 'Root message',
    ])->json('data');

    $reply = actingAs($recipient)->postJson("/api/conversations/{$conversation->getKey()}/messages", [
        'body' => 'Reply message',
        'reply_to_id' => $initial['id'],
    ])->json('data');

    actingAs($sender)
        ->getJson("/api/messages/{$reply['id']}/thread")
        ->assertOk()
        ->assertJsonPath('message.id', $reply['id'])
        ->assertJsonCount(1, 'context');
});

it('attaches uploaded images to messages', function (): void {
    Storage::fake('local');

    $sender = messagingUser();
    $recipient = messagingUser();
    $conversation = makeDirectConversation($sender, $recipient);

    /** @var TemporaryUploadService $temporaryUploads */
    $temporaryUploads = app(TemporaryUploadService::class);

    $upload = $temporaryUploads->store(UploadedFile::fake()->image('photo.jpg', 640, 480));

    $response = actingAs($sender)->postJson("/api/conversations/{$conversation->getKey()}/messages", [
        'body' => 'Photo attached',
        'attachments' => [
            [
                'id' => $upload['identifier'],
                'mime_type' => $upload['mime_type'],
                'size' => $upload['size'],
                'original_name' => $upload['original_name'],
            ],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonCount(1, 'data.attachments');

    $attachment = MessageAttachment::query()->first();

    expect($attachment)
        ->not->toBeNull()
        ->and(Storage::disk($attachment->disk)->exists($attachment->path))->toBeTrue()
        ->and($attachment->type)->toBe('image');
});

it('toggles message reactions', function (): void {
    $sender = messagingUser();
    $recipient = messagingUser();
    $conversation = makeDirectConversation($sender, $recipient);

    $message = actingAs($sender)->postJson("/api/conversations/{$conversation->getKey()}/messages", [
        'body' => 'React to this',
    ])->assertCreated()->json('data');

    actingAs($recipient)
        ->postJson("/api/messages/{$message['id']}/reactions", [
            'emoji' => '🔥',
        ])
        ->assertOk()
        ->assertJsonPath('reactions.0.count', 1);

    actingAs($recipient)
        ->postJson("/api/messages/{$message['id']}/reactions", [
            'emoji' => '🔥',
        ])
        ->assertOk()
        ->assertJsonMissingPath('reactions.0'); // reaction removed
});

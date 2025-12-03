<?php

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\actingAs;

uses(RefreshDatabase::class);

function completedUser(array $attributes = []): User
{
    return User::factory()->create(array_merge([
        'profile_completed_at' => now(),
    ], $attributes));
}

it('creates a direct conversation between users', function (): void {
    $initiator = completedUser();
    $recipient = completedUser();

    $response = actingAs($initiator)->postJson('/api/conversations', [
        'type' => 'direct',
        'recipient_id' => $recipient->getKey(),
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.type', 'direct')
        ->assertJsonPath('data.participant_count', 2);

    $conversationId = $response->json('data.id');

    expect(Conversation::query()->find($conversationId))
        ->not->toBeNull()
        ->and(Conversation::query()->find($conversationId)->participant_count)->toBe(2);
});

it('prevents creating a direct conversation with a blocked user', function (): void {
    $initiator = completedUser();
    $recipient = completedUser();

    $initiator->blocks()->create([
        'blocked_id' => $recipient->getKey(),
    ]);

    $response = actingAs($initiator)->postJson('/api/conversations', [
        'type' => 'direct',
        'recipient_id' => $recipient->getKey(),
    ]);

    $response->assertForbidden();
});

it('creates a group conversation with participants', function (): void {
    $initiator = completedUser();
    $memberA = completedUser();
    $memberB = completedUser();

    $response = actingAs($initiator)->postJson('/api/conversations', [
        'type' => 'group',
        'subject' => 'Weekend plans',
        'participant_ids' => [
            $initiator->getKey(),
            $memberA->getKey(),
            $memberB->getKey(),
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.type', 'group')
        ->assertJsonPath('data.participant_count', 3);

    $conversation = Conversation::query()->find($response->json('data.id'));

    expect($conversation)->not->toBeNull()
        ->and($conversation->participant_count)->toBe(3);
});

it('adds participants to an existing conversation', function (): void {
    $initiator = completedUser();
    $memberA = completedUser();
    $memberB = completedUser();
    $invitee = completedUser();

    $conversation = Conversation::factory()
        ->group()
        ->for($initiator, 'creator')
        ->create([
            'participant_count' => 0,
        ]);

    $conversation->participants()->createMany([
        [
            'user_id' => $initiator->getKey(),
            'role' => 'owner',
            'joined_at' => now(),
        ],
        [
            'user_id' => $memberA->getKey(),
            'role' => 'member',
            'joined_at' => now(),
        ],
        [
            'user_id' => $memberB->getKey(),
            'role' => 'member',
            'joined_at' => now(),
        ],
    ]);

    $conversation->update(['participant_count' => 3]);

    $response = actingAs($initiator)->postJson("/api/conversations/{$conversation->ulid}/participants", [
        'participant_ids' => [$invitee->getKey()],
    ]);

    $response->assertOk()
        ->assertJsonPath('data.participant_count', 4);

    expect($conversation->fresh()->participant_count)->toBe(4);
});

it('allows a participant to leave a conversation', function (): void {
    $owner = completedUser();
    $member = completedUser();

    $conversation = Conversation::factory()
        ->group()
        ->for($owner, 'creator')
        ->create([
            'participant_count' => 2,
        ]);

    $conversation->participants()->createMany([
        [
            'user_id' => $owner->getKey(),
            'role' => 'owner',
            'joined_at' => now(),
        ],
        [
            'user_id' => $member->getKey(),
            'role' => 'member',
            'joined_at' => now(),
        ],
    ]);

    actingAs($member)
        ->deleteJson("/api/conversations/{$conversation->ulid}/participants/{$member->getKey()}")
        ->assertNoContent();

    expect($conversation->fresh()->participant_count)->toBe(1)
        ->and($conversation->participants()
            ->where('user_id', $member->getKey())
            ->first()
            ->left_at)->not->toBeNull();
});

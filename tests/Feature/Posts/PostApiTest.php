<?php

use App\Enums\PostAudience;
use App\Enums\PostType;
use App\Events\PostPublished;
use App\Models\Post;
use App\Models\PostPoll;
use App\Models\PostPollOption;
use App\Models\Timeline;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('creates a text post with hashtags', function (): void {
    Event::fake();

    $user = User::factory()->create();

    Sanctum::actingAs($user);

    $response = $this->postJson('/api/posts', [
        'type' => PostType::Text->value,
        'audience' => PostAudience::Public->value,
        'body' => 'This is a new post',
        'hashtags' => ['kink', 'edgeplay'],
    ]);

    $response->assertCreated();

    $payload = $response->json('data');

    expect($payload)
        ->toBeArray()
        ->and($payload['likes_count'])->toBe(0)
        ->and($payload['comments_count'])->toBe(0)
        ->and($payload['reposts_count'])->toBe(0)
        ->and($payload['poll_votes_count'])->toBe(0)
        ->and($payload['views_count'])->toBe(0)
        ->and($payload['has_liked'])->toBeFalse()
        ->and($payload['extra_attributes'])->toBeArray();

    Event::assertDispatched(PostPublished::class);

    $post = Post::query()->first();

    expect($post)
        ->not->toBeNull()
        ->and($post->author->is($user))->toBeTrue()
        ->and($post->hashtags)->toHaveCount(2)
        ->and($post->hashtags->pluck('name')->all())->toMatchArray(['Kink', 'Edgeplay']);

    expect(
        Timeline::query()
            ->where('user_id', $user->getKey())
            ->where('post_id', $post->getKey())
            ->exists()
    )->toBeTrue();
});

it('creates a post with a tip goal', function (): void {
    Event::fake();

    $user = User::factory()->create([
        'profile_completed_at' => now(),
    ]);

    Sanctum::actingAs($user);

    $response = $this->postJson('/api/posts', [
        'type' => PostType::Text->value,
        'audience' => PostAudience::Public->value,
        'body' => 'Unlock the next ritual tonight.',
        'extra_attributes' => [
            'tip_goal' => [
                'amount' => 2500,
                'currency' => 'USD',
                'label' => 'Trigger the wax cascade',
            ],
        ],
    ]);

    $response->assertCreated();

    $post = Post::query()->first();

    $tipGoal = $post?->extra_attributes['tip_goal'] ?? [];

    expect($tipGoal)->toMatchArray([
        'amount' => 2500,
        'currency' => 'USD',
        'label' => 'Trigger the wax cascade',
    ]);

    expect($tipGoal['deadline'] ?? null)->toBeNull();
});

it('validates tip goal amount when creating a post', function (): void {
    $user = User::factory()->create([
        'profile_completed_at' => now(),
    ]);

    Sanctum::actingAs($user);

    $response = $this->postJson('/api/posts', [
        'type' => PostType::Text->value,
        'audience' => PostAudience::Public->value,
        'body' => 'Preview tonight',
        'extra_attributes' => [
            'tip_goal' => [
                'amount' => 50,
                'currency' => 'USD',
            ],
        ],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['extra_attributes.tip_goal.amount']);
});

it('updates a post replacing poll and hashtags', function (): void {
    $user = User::factory()->create();

    $post = Post::factory()
        ->for($user, 'author')
        ->create([
            'type' => PostType::Poll->value,
            'audience' => PostAudience::Followers->value,
            'body' => 'Original body',
        ]);

    $poll = PostPoll::factory()->for($post)->create([
        'question' => 'Initial question?',
        'allow_multiple' => false,
    ]);

    PostPollOption::factory()->count(2)->sequence(
        ['title' => 'Rope', 'position' => 0],
        ['title' => 'Impact', 'position' => 1],
    )->for($poll, 'poll')->create();

    Sanctum::actingAs($user);

    $response = $this->putJson("/api/posts/{$post->getKey()}", [
        'body' => 'Updated text',
        'audience' => PostAudience::Subscribers->value,
        'hashtags' => ['updated', 'tags'],
        'poll' => [
            'question' => 'Which option is best?',
            'allow_multiple' => true,
            'max_choices' => 2,
            'options' => ['First', 'Second'],
        ],
    ]);

    $response->assertOk();

    $post->refresh();

    expect($post->body)->toBe('Updated text')
        ->and($post->audience->value)->toBe(PostAudience::Subscribers->value)
        ->and($post->poll)->not->toBeNull()
        ->and($post->poll->question)->toBe('Which option is best?')
        ->and($post->poll->allow_multiple)->toBeTrue()
        ->and($post->poll->options)->toHaveCount(2)
        ->and($post->hashtags->pluck('name')->all())->toMatchArray(['Updated', 'Tags']);
});

it('deletes a post', function (): void {
    $user = User::factory()->create();

    $post = Post::factory()
        ->for($user, 'author')
        ->create();

    Timeline::factory()->create([
        'user_id' => $user->getKey(),
        'post_id' => $post->getKey(),
    ]);

    Sanctum::actingAs($user);

    $this->deleteJson("/api/posts/{$post->getKey()}")->assertNoContent();

    expect(Post::query()->whereKey($post->getKey())->exists())->toBeFalse();
    expect(
        Timeline::query()
            ->where('post_id', $post->getKey())
            ->exists()
    )->toBeFalse();
});

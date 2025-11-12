<?php

use App\Enums\PostAudience;
use App\Models\Post;
use App\Models\PostPoll;
use App\Models\PostPollOption;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('records a poll vote and increments counts', function (): void {
    $user = User::factory()->create();
    $author = User::factory()->create();

    $post = Post::factory()
        ->for($author, 'author')
        ->create([
            'audience' => PostAudience::Public->value,
        ]);

    $poll = PostPoll::factory()->for($post)->create([
        'question' => 'Choose?',
        'allow_multiple' => false,
    ]);

    $option = PostPollOption::factory()->for($poll, 'poll')->create(['title' => 'Yes']);

    Sanctum::actingAs($user);

    $this->postJson("/api/polls/{$poll->getKey()}/vote", [
        'option_id' => $option->getKey(),
    ])->assertOk();

    $option->refresh();
    $post->refresh();

    expect($option->vote_count)->toBe(1)
        ->and($post->poll_votes_count)->toBe(1);
});

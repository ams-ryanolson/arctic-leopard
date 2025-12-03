<?php

use App\Enums\PostAudience;
use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use App\Services\UserBlockService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

dataset('invalid-parent-comments', function () {
    yield 'replying to depth two comment' => function (): array {
        $author = User::factory()->create();
        $user = User::factory()->create();

        $post = Post::factory()
            ->for($author, 'author')
            ->create([
                'audience' => PostAudience::Public->value,
            ]);

        $root = Comment::factory()->for($post)->for($author, 'author')->create([
            'depth' => 0,
        ]);

        $child = Comment::factory()->for($post)->for($author, 'author')->create([
            'parent_id' => $root->getKey(),
            'depth' => 1,
        ]);

        $grandchild = Comment::factory()->for($post)->for($author, 'author')->create([
            'parent_id' => $child->getKey(),
            'depth' => 2,
        ]);

        return [$post, $grandchild, $user];
    };
});

it('creates a comment on a post', function (): void {
    $author = User::factory()->create();
    $user = User::factory()->create();

    $post = Post::factory()
        ->for($author, 'author')
        ->create([
            'audience' => PostAudience::Public->value,
        ]);

    Sanctum::actingAs($user);

    $response = $this->postJson(route('api.posts.comments.store', $post), [
        'body' => 'Great post!',
    ]);

    $response->assertCreated();

    $comment = Comment::query()->first();

    expect($comment)->not->toBeNull()
        ->and($comment->post_id)->toBe($post->getKey())
        ->and($comment->depth)->toBe(0)
        ->and($post->fresh()->comments_count)->toBe(1);
});

it('increments comment count when replying via the api', function (): void {
    $author = User::factory()->create();
    $user = User::factory()->create();

    $post = Post::factory()
        ->for($author, 'author')
        ->create([
            'audience' => PostAudience::Public->value,
        ]);

    Sanctum::actingAs($user);

    $this->postJson(route('api.posts.comments.store', $post), [
        'body' => 'Root comment',
    ])->assertCreated();

    $root = Comment::query()->latest('id')->first();

    expect($root)->not->toBeNull();

    $post->refresh();
    expect($post->comments_count)->toBe(1);

    $this->postJson(route('api.posts.comments.store', $post), [
        'body' => 'Replying to the thread',
        'parent_id' => $root->getKey(),
    ])->assertCreated()
        ->assertJsonFragment([
            'parent_id' => $root->getKey(),
        ]);

    $root->refresh();
    $post->refresh();

    expect($post->comments_count)->toBe(2)
        ->and($root->replies_count)->toBe(1);
});

it('prevents replies beyond allowed depth', function (Closure $state): void {
    [$post, $parent, $user] = $state();

    Sanctum::actingAs($user);

    $this->postJson(route('api.posts.comments.store', $post), [
        'body' => 'Too deep',
        'parent_id' => $parent->getKey(),
    ])->assertStatus(422);
})->with('invalid-parent-comments');

it('returns nested comments including deleted placeholders', function (): void {
    $author = User::factory()->create();
    $viewer = User::factory()->create();

    $post = Post::factory()
        ->for($author, 'author')
        ->create([
            'audience' => PostAudience::Public->value,
        ]);

    $root = Comment::factory()->for($post)->for($author, 'author')->create([
        'depth' => 0,
    ]);

    $reply = Comment::factory()->for($post)->for($author, 'author')->create([
        'parent_id' => $root->getKey(),
        'depth' => 1,
    ]);

    $grandchild = Comment::factory()->for($post)->for($author, 'author')->create([
        'parent_id' => $reply->getKey(),
        'depth' => 2,
    ]);

    $reply->delete();

    Sanctum::actingAs($viewer);

    $response = $this->getJson(route('api.posts.comments.index', $post))->assertOk();

    $payload = $response->json('data');

    expect($payload)->toBeArray()
        ->and($payload[0]['id'])->toBe($root->getKey())
        ->and($payload[0]['replies'][0]['id'])->toBe($reply->getKey())
        ->and($payload[0]['replies'][0]['is_deleted'])->toBeTrue()
        ->and($payload[0]['replies'][0]['replies'][0]['id'])->toBe($grandchild->getKey());
});

it('soft deletes a comment without affecting counts', function (): void {
    $author = User::factory()->create();
    $user = User::factory()->create();

    $post = Post::factory()
        ->for($author, 'author')
        ->create([
            'audience' => PostAudience::Public->value,
        ]);

    $post->forceFill(['comments_count' => 1])->save();

    $comment = Comment::factory()
        ->for($post)
        ->for($user, 'author')
        ->create([
            'depth' => 0,
        ]);

    Sanctum::actingAs($user);

    $response = $this->deleteJson(route('api.posts.comments.destroy', [$post, $comment]))->assertOk();

    $comment->refresh();
    $post->refresh();

    expect($post->comments_count)->toBe(1)
        ->and($comment->trashed())->toBeTrue();

    $response->assertJsonFragment([
        'id' => $comment->getKey(),
        'is_deleted' => true,
    ]);
});

it('likes and unlikes a comment', function (): void {
    $author = User::factory()->create();
    $user = User::factory()->create();

    $post = Post::factory()
        ->for($author, 'author')
        ->create([
            'audience' => PostAudience::Public->value,
        ]);

    $comment = Comment::factory()
        ->for($post)
        ->for($author, 'author')
        ->create([
            'depth' => 0,
        ]);

    Sanctum::actingAs($user);

    $this->postJson(route('api.posts.comments.like.store', [$post, $comment]))
        ->assertOk()
        ->assertJsonFragment([
            'id' => $comment->getKey(),
            'likes_count' => 1,
            'has_liked' => true,
        ]);

    $comment->refresh();
    expect($comment->likes_count)->toBe(1);

    $this->deleteJson(route('api.posts.comments.like.destroy', [$post, $comment]))
        ->assertOk()
        ->assertJsonFragment([
            'id' => $comment->getKey(),
            'likes_count' => 0,
            'has_liked' => false,
        ]);
});

it('hides comments authored by blocked users while preserving the thread', function (): void {
    $author = User::factory()->create();
    $blocked = User::factory()->create();

    $post = Post::factory()
        ->for($author, 'author')
        ->create([
            'audience' => PostAudience::Public->value,
        ]);

    $comment = Comment::factory()
        ->for($post)
        ->for($blocked, 'author')
        ->create([
            'depth' => 0,
        ]);

    app(UserBlockService::class)->block($author, $blocked);

    Sanctum::actingAs($author);

    $response = $this->getJson(route('api.posts.comments.index', $post))
        ->assertOk();

    $payload = $response->json('data');

    expect($payload)->toBeArray()
        ->and($payload[0]['id'])->toBe($comment->getKey())
        ->and($payload[0]['is_hidden'])->toBeTrue()
        ->and($payload[0]['body'])->toBeNull()
        ->and($payload[0]['placeholder'])->toBe('This comment is hidden.')
        ->and($payload[0]['author'])->toBeNull();
});

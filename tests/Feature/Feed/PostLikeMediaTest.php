<?php

use App\Enums\PostAudience;
use App\Models\Post;
use App\Models\PostMedia;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('returns media attachments when liking and unliking a post', function (): void {
    $author = User::factory()->create();
    $viewer = User::factory()->create();

    $post = Post::factory()
        ->for($author, 'author')
        ->create([
            'audience' => PostAudience::Public->value,
        ]);

    PostMedia::factory()
        ->count(2)
        ->sequence(
            ['position' => 0, 'path' => 'media/sample-1.jpg'],
            ['position' => 1, 'path' => 'media/sample-2.jpg'],
        )
        ->for($post)
        ->create([
            'disk' => 'public',
            'mime_type' => 'image/jpeg',
        ]);

    Sanctum::actingAs($viewer);

    $likeResponse = $this->postJson("/api/posts/{$post->getKey()}/like");

    $likeResponse->assertOk();

    $likedPayload = $likeResponse->json('data');

    expect($likedPayload)
        ->toBeArray()
        ->and($likedPayload['media'])->toBeArray()->toHaveCount(2)
        ->and($likedPayload['media'][0])->toHaveKeys(['url', 'path', 'type', 'optimized_path', 'optimized_url'])
        ->and($likedPayload['has_liked'])->toBeTrue();

    $unlikeResponse = $this->deleteJson("/api/posts/{$post->getKey()}/like");

    $unlikeResponse->assertOk();

    $unlikedPayload = $unlikeResponse->json('data');

    expect($unlikedPayload)
        ->toBeArray()
        ->and($unlikedPayload['media'])->toBeArray()->toHaveCount(2)
        ->and($unlikedPayload['has_liked'])->toBeFalse();
});

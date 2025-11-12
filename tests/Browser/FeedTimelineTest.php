<?php

use App\Enums\PostAudience;
use App\Enums\PostType;
use App\Models\User;
use App\Models\Post;
use App\Services\Posts\PostCreationService;

test('dashboard feed renders timeline entries for the viewer', function () {
    if (! function_exists('visit')) {
        $this->markTestSkipped('Browser plugin not installed. Install pestphp/pest-plugin-browser and Playwright to enable browser tests.');
    }

    /** @var User $user */
    $user = User::factory()->create();

    /** @var PostCreationService $posts */
    $posts = app(PostCreationService::class);

    $posts->create(
        $user,
        [
            'type' => PostType::Text->value,
            'audience' => PostAudience::Public->value,
            'body' => 'Timeline smoke check',
        ],
        media: [],
        pollData: null,
        hashtags: [],
    );

    $this->actingAs($user);

    $page = visit('/dashboard');

    $page->assertSee('Scene feed')
        ->assertSee('Timeline smoke check');
});

test('dashboard surfaces new drops banner when realtime events arrive', function () {
    if (! function_exists('visit')) {
        $this->markTestSkipped('Browser plugin not installed. Install pestphp/pest-plugin-browser and Playwright to enable browser tests.');
    }

    $viewer = User::factory()->create();

    $this->actingAs($viewer);

    $page = visit('/dashboard');

    $page->assertSee('Scene feed')
        ->assertDontSee('new drop');

    $payload = [
        'timeline_id' => 4242,
        'post_id' => 31337,
        'visibility_source' => 'following',
        'post' => [
            'id' => 31337,
            'type' => PostType::Text->value,
            'audience' => PostAudience::Public->value,
            'body' => 'Realtime broadcast payload',
            'published_at' => now()->toIso8601String(),
            'created_at' => now()->toIso8601String(),
            'author' => [
                'id' => $viewer->getKey(),
                'display_name' => $viewer->display_name ?? $viewer->name,
                'username' => $viewer->username,
                'avatar_url' => $viewer->avatar_url,
            ],
        ],
    ];

    $page->evaluate('window.__emitTimelineBroadcast', "timeline.{$viewer->getKey()}", $payload);

    $page->waitForText('new drop');

    $page->assertSee('new drop');

    $page->click('View');

    $page->waitForText('Refreshing…');
});



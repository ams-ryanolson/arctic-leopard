<?php

use App\Models\Circle;
use App\Models\User;
use Illuminate\Broadcasting\BroadcastManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    config()->set('broadcasting.default', 'pusher');
    config()->set('broadcasting.connections.pusher.key', 'test-key');
    config()->set('broadcasting.connections.pusher.secret', 'test-secret');
    config()->set('broadcasting.connections.pusher.app_id', 'test-app');
    config()->set('broadcasting.connections.pusher.options.cluster', 'test');

    app(BroadcastManager::class)->purge('pusher');
    app(BroadcastManager::class)->setDefaultDriver('pusher');

    require base_path('routes/channels.php');
});

it('authorizes toast channel for the authenticated user', function (): void {
    $user = User::factory()->create();

    $request = Request::create('/broadcasting/auth', 'POST', [
        'channel_name' => sprintf('private-users.%d.toasts', $user->getKey()),
        'socket_id' => '12345.67890',
    ]);

    $request->setUserResolver(fn () => $user);

    $broadcaster = app(BroadcastManager::class)->connection('pusher');

    expect($broadcaster->normalizeChannelName($request->channel_name))
        ->toBe(sprintf('users.%d.toasts', $user->getKey()));

    expect(fn () => $broadcaster->auth($request))->not->toThrow(AccessDeniedHttpException::class);
});

it('rejects toast channel authorization for other users', function (): void {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $request = Request::create('/broadcasting/auth', 'POST', [
        'channel_name' => sprintf('private-users.%d.toasts', $otherUser->getKey()),
        'socket_id' => '12345.67890',
    ]);

    $request->setUserResolver(fn () => $user);

    $broadcaster = app(BroadcastManager::class)->connection('pusher');

    expect(fn () => $broadcaster->auth($request))->toThrow(AccessDeniedHttpException::class);
});

it('authorizes presence channel access for circle members', function (): void {
    $user = User::factory()->create();
    $circle = Circle::factory()->create();

    $circle->members()->attach($user->getKey());

    $request = Request::create('/broadcasting/auth', 'POST', [
        'channel_name' => sprintf('presence-circles.%s', $circle->slug),
        'socket_id' => '12345.67890',
    ]);

    $request->setUserResolver(fn () => $user);

    $broadcaster = app(BroadcastManager::class)->connection('pusher');

    expect(fn () => $broadcaster->auth($request))->not->toThrow(AccessDeniedHttpException::class);
});

it('denies presence channel access to non-members', function (): void {
    $user = User::factory()->create();
    $circle = Circle::factory()->create();

    $request = Request::create('/broadcasting/auth', 'POST', [
        'channel_name' => sprintf('presence-circles.%s', $circle->slug),
        'socket_id' => '12345.67890',
    ]);

    $request->setUserResolver(fn () => $user);

    $broadcaster = app(BroadcastManager::class)->connection('pusher');

    expect(fn () => $broadcaster->auth($request))->toThrow(AccessDeniedHttpException::class);
});

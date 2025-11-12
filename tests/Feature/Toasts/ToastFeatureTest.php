<?php

use App\Events\Toasts\ToastActionResolved;
use App\Events\Toasts\ToastAcknowledged;
use App\Events\Toasts\ToastPushed;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\User;
use App\Services\Toasts\ToastBus;
use App\Support\Toasts\ToastPayload;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    config(['cache.default' => 'array']);
    Cache::store()->clear();
});

function makeToast(array $overrides = []): ToastPayload
{
    return ToastPayload::make([
        'id' => $overrides['id'] ?? Str::ulid()->toBase32(),
        'level' => 'info',
        'body' => 'Test notification',
        ...$overrides,
    ]);
}

it('queues toasts per user and exposes them via the bus', function (): void {
    Event::fake([ToastPushed::class]);

    $user = User::factory()->create();
    $bus = app(ToastBus::class);

    $toast = makeToast(['title' => 'Heads up']);

    $bus->push($user, $toast);

    Event::assertDispatched(ToastPushed::class);

    $peeked = $bus->peek($user);

    expect($peeked)->toHaveCount(1);
    expect($peeked[0]['id'])->toBe($toast->id);

    $found = $bus->find($user, $toast->id);

    expect($found)->not()->toBeNull();
    expect($found?->id)->toBe($toast->id);
});

it('acknowledges a toast through the lifecycle endpoint', function (): void {
    Event::fake([ToastAcknowledged::class]);

    $user = User::factory()->create(['email_verified_at' => now()]);
    $bus = app(ToastBus::class);
    $toast = makeToast();

    $bus->push($user, $toast);

    $this->actingAs($user)
        ->post(route('toasts.acknowledge', ['toast' => $toast->id]))
        ->assertNoContent();

    Event::assertDispatched(ToastAcknowledged::class, function (ToastAcknowledged $event) use ($user, $toast): bool {
        return $event->user->is($user) && $event->payload->id === $toast->id;
    });

    expect($bus->peek($user))->toBeEmpty();
});

it('resolves an actionable toast and removes it from the queue', function (): void {
    Event::fake([ToastActionResolved::class]);

    $user = User::factory()->create(['email_verified_at' => now()]);
    $bus = app(ToastBus::class);
    $toast = makeToast([
        'requiresInteraction' => true,
        'actions' => [
            [
                'key' => 'approve',
                'label' => 'Approve',
                'method' => 'http.post',
            ],
        ],
    ]);

    $bus->push($user, $toast);

    $payload = ['notes' => 'Looks good'];

    $response = $this->actingAs($user)->post(route('toasts.action', ['toast' => $toast->id]), [
        'action' => 'approve',
        'payload' => $payload,
    ]);

    $response->assertOk()
        ->assertJsonPath('toast.id', $toast->id)
        ->assertJsonPath('action.key', 'approve');

    Event::assertDispatched(ToastActionResolved::class, function (ToastActionResolved $event) use ($user, $toast, $payload): bool {
        return $event->user->is($user)
            && $event->payload->id === $toast->id
            && $event->actionKey === 'approve'
            && $event->input === $payload;
    });

    expect($bus->peek($user))->toBeEmpty();
});

it('shares queued toasts through the inertia middleware', function (): void {
    $user = User::factory()->create();
    $bus = app(ToastBus::class);
    $middleware = app(HandleInertiaRequests::class);

    $toast = makeToast();

    $bus->push($user, $toast);

    $request = Request::create('/dashboard', 'GET');
    $request->setUserResolver(static fn () => $user);

    $shared = $middleware->share($request);

    expect($shared)->toHaveKey('toasts');
    expect(is_callable($shared['toasts']))->toBeTrue();

    /** @var callable(): array $resolver */
    $resolver = $shared['toasts'];
    $resolved = $resolver();

    expect($resolved)->toHaveCount(1);
    expect($resolved[0]['id'])->toBe($toast->id);
});


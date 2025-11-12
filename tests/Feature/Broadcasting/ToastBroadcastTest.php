<?php

use App\Events\Toasts\ToastPushed;
use App\Models\User;
use App\Services\Toasts\ToastBus;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

it('broadcasts toast payload to the user channel', function (): void {
    Event::fake([ToastPushed::class]);

    $user = User::factory()->create();

    app(ToastBus::class)->success($user, 'Welcome home!', [
        'title' => 'Realtime ready',
    ]);

    Event::assertDispatched(ToastPushed::class, function (ToastPushed $event) use ($user): bool {
        expect($event->user->is($user))->toBeTrue();
        expect($event->broadcastOn())
            ->toBeInstanceOf(PrivateChannel::class)
            ->and($event->broadcastOn()->name)
            ->toBe(sprintf('private-users.%d.toasts', $user->getKey()));
        expect($event->broadcastAs())->toBe('ToastPushed');
        expect($event->broadcastWith())->toMatchArray([
            'body' => 'Welcome home!',
            'level' => 'success',
            'title' => 'Realtime ready',
        ]);

        return true;
    });
});






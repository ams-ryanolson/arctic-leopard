<?php

use App\Models\User;
use Illuminate\Support\Facades\Queue;

test('data export can be requested', function () {
    Queue::fake();

    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post(route('settings.account.export'));

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    Queue::assertPushed(\App\Jobs\ExportUserData::class, function ($job) use ($user) {
        return $job->user->id === $user->id;
    });
});

<?php

use App\Models\User;
use App\Models\UserNotificationPreference;

test('notifications page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('settings.notifications.edit'));

    $response->assertOk();
});

test('notification preferences are created when viewing page', function () {
    $user = User::factory()->create();

    expect($user->notificationPreferences)->toBeNull();

    $response = $this
        ->actingAs($user)
        ->get(route('settings.notifications.edit'));

    $response->assertOk();

    $user->refresh();
    expect($user->notificationPreferences)->not->toBeNull();
    expect($user->notificationPreferences->follows)->toBeTrue();
});

test('notification preferences can be updated', function () {
    $user = User::factory()->create();
    $preferences = UserNotificationPreference::factory()->create([
        'user_id' => $user->id,
        'follows' => true,
        'post_likes' => true,
    ]);

    $response = $this
        ->actingAs($user)
        ->patch(route('settings.notifications.update'), [
            'follows' => false,
            'post_likes' => false,
            'messages' => true,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('settings.notifications.edit'));

    $preferences->refresh();
    expect($preferences->follows)->toBeFalse();
    expect($preferences->post_likes)->toBeFalse();
    expect($preferences->messages)->toBeTrue();
});

<?php

use App\Models\User;

test('profile page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('settings.profile.edit'));

    $response->assertOk();
});

test('profile information can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('settings.profile.update'), [
            'username' => $user->username,
            'email' => 'test@example.com',
            'display_name' => 'Test Display',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('settings.profile.edit'));

    $user->refresh();

    expect($user->username)->toBe($user->username);
    expect($user->email)->toBe('test@example.com');
    expect($user->display_name)->toBe('Test Display');
    expect($user->email_verified_at)->toBeNull();
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('settings.profile.update'), [
            'username' => $user->username,
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('settings.profile.edit'));

    expect($user->refresh()->email_verified_at)->not->toBeNull();
});

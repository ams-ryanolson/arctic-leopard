<?php

use App\Models\User;

test('privacy page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('settings.privacy.edit'));

    $response->assertOk();
});

test('privacy settings can be updated', function () {
    $user = User::factory()->create([
        'requires_follow_approval' => false,
    ]);

    $response = $this
        ->actingAs($user)
        ->patch(route('settings.privacy.update'), [
            'requires_follow_approval' => true,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('settings.privacy.edit'));

    expect($user->refresh()->requires_follow_approval)->toBeTrue();
});

test('privacy settings can be disabled', function () {
    $user = User::factory()->create([
        'requires_follow_approval' => true,
    ]);

    $response = $this
        ->actingAs($user)
        ->patch(route('settings.privacy.update'), [
            'requires_follow_approval' => false,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('settings.privacy.edit'));

    expect($user->refresh()->requires_follow_approval)->toBeFalse();
});

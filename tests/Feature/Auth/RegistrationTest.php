<?php

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertStatus(200);
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'username' => 'scenequeen',
        'email' => 'test@example.com',
        'password' => 'HyenaFang1!',
        'password_confirmation' => 'HyenaFang1!',
        'birthdate' => now()->subYears(20)->toDateString(),
        'location_city' => 'San Francisco',
        'location_region' => 'California',
        'location_country' => 'United States',
        'location_latitude' => '37.7749290',
        'location_longitude' => '-122.4194180',
        'accepted_terms' => '1',
        'accepted_privacy' => '1',
    ]);

    $response->assertSessionHasNoErrors();
    $this->assertAuthenticated();
    $response->assertRedirect(route('verification.notice', absolute: false));
});

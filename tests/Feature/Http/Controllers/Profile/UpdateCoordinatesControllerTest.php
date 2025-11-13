<?php

use App\Models\User;

it('updates only the coordinates for the authenticated user', function (): void {
    $user = User::factory()->create([
        'location_city' => 'Los Angeles',
        'location_region' => 'CA',
        'location_country' => 'US',
        'location_latitude' => 34.052235,
        'location_longitude' => -118.243683,
    ]);

    $this->actingAs($user);

    $this
        ->patch(route('profile.location.update'), [
            'location_latitude' => 34.101235,
            'location_longitude' => -118.321123,
        ])
        ->assertRedirect(route('radar'));

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'location_city' => 'Los Angeles',
        'location_region' => 'CA',
        'location_country' => 'US',
        'location_latitude' => 34.101235,
        'location_longitude' => -118.321123,
    ]);
});

it('requires valid coordinate data', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user);

    $this
        ->patch(route('profile.location.update'), [
            'location_latitude' => 'north',
            'location_longitude' => 'west',
        ])
        ->assertSessionHasErrors([
            'location_latitude',
            'location_longitude',
        ]);
});

<?php

use App\Models\User;

it('enables the traveler beacon for the viewer', function (): void {
    $user = User::factory()->create([
        'is_traveling' => false,
    ]);

    $this->actingAs($user);

    $this
        ->patch(route('profile.travel-beacon.update'), [
            'traveling' => true,
        ])
        ->assertRedirect(route('radar'));

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'is_traveling' => true,
    ]);
});

it('disables the traveler beacon for the viewer', function (): void {
    $user = User::factory()->create([
        'is_traveling' => true,
    ]);

    $this->actingAs($user);

    $this
        ->patch(route('profile.travel-beacon.update'), [
            'traveling' => false,
        ])
        ->assertRedirect(route('radar'));

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'is_traveling' => false,
    ]);
});

it('validates traveler beacon payload', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user);

    $this
        ->patch(route('profile.travel-beacon.update'), [
            'traveling' => 'maybe',
        ])
        ->assertSessionHasErrors(['traveling']);
});

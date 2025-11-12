<?php

use App\Models\User;

it('allows guests to view the welcome page', function (): void {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('welcome'));
});

it('redirects authenticated users away from the welcome page', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/')
        ->assertRedirect(route('dashboard'));
});

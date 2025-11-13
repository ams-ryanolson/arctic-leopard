<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests cannot view upgrade page', function () {
    $this->get(route('upgrade'))->assertRedirect(route('login'));
});

test('authenticated users can view upgrade page', function () {
    $this->actingAs(User::factory()->create());

    $this->get(route('upgrade'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Subscriptions/Upgrade')
            ->has('plans', 3)
            ->where('plans.0.id', 'premium')
            ->where('plans.1.id', 'elite')
            ->where('plans.2.id', 'unlimited')
        );
});

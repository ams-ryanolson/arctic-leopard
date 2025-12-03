<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests cannot view upgrade page', function () {
    $this->get(route('upgrade'))->assertRedirect(route('login'));
});

test('authenticated users can view upgrade page', function () {
    // Seed membership plans
    app(\Database\Seeders\MembershipPlansSeeder::class)->run();

    $this->actingAs(User::factory()->create());

    $this->get(route('upgrade'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Memberships/Upgrade')
            ->has('plans', 3)
            ->where('plans.0.slug', 'bronze')
            ->where('plans.1.slug', 'silver')
            ->where('plans.2.slug', 'gold')
        );
});

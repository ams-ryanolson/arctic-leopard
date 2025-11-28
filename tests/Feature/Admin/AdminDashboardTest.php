<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests cannot view the admin dashboard', function () {
    $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
});

test('users without admin permissions cannot view the admin dashboard', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.dashboard'))
        ->assertRedirect(route('dashboard'));
});

test('admin role can view the admin dashboard', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->has('welcome')
            ->has('overview')
            ->has('financial')
            ->has('recentActivity')
            ->has('quickLinks')
        );
});

test('super admin role can view the admin dashboard', function () {
    $superAdmin = User::factory()->create();
    $superAdmin->assignRole('Super Admin');

    $this->actingAs($superAdmin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->has('welcome')
            ->has('overview')
            ->has('financial')
            ->has('recentActivity')
            ->has('quickLinks')
        );
});

test('admin dashboard displays financial metrics', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->has('financial.today')
            ->has('financial.this_week')
            ->has('financial.this_month')
            ->has('financial.subscriptions')
            ->has('financial.breakdown')
        );
});

<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can browse the user directory with search filters', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $matchingUser = User::factory()->create([
        'name' => 'Unique Visionary',
        'username' => 'visionary',
        'email' => 'visionary@example.com',
    ]);
    $matchingUser->assignRole('Creator');

    $nonMatchingUser = User::factory()->create([
        'name' => 'Another Person',
        'username' => 'different-user',
        'email' => 'different@example.com',
    ]);
    $nonMatchingUser->assignRole('User');

    $this->actingAs($admin)
        ->get(route('admin.users.index', ['search' => 'visionary']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Users/Index')
            ->where('filters.search', 'visionary')
            ->has('users.data', 1)
            ->where('users.data.0.email', $matchingUser->email)
            ->where('availableRoles.0.name', 'Admin')
        );
});

test('role filter restricts user results', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $creator = User::factory()->create([
        'name' => 'Creator Sample',
        'email' => 'creator@example.com',
        'username' => 'creator-sample',
    ]);
    $creator->assignRole('Creator');

    $moderator = User::factory()->create([
        'name' => 'Moderator Sample',
        'email' => 'moderator@example.com',
        'username' => 'moderator-sample',
    ]);
    $moderator->assignRole('Moderator');

    $this->actingAs($admin)
        ->get(route('admin.users.index', ['role' => 'Creator']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Users/Index')
            ->where('filters.role', 'Creator')
            ->has('users.data', 1)
            ->where('users.data.0.email', $creator->email)
        );
});

test('admin can update a user roles list', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $user = User::factory()->create([
        'name' => 'Role Test Subject',
        'email' => 'subject@example.com',
        'username' => 'subject',
    ]);
    $user->assignRole('User');

    $response = $this->actingAs($admin)->patch(route('admin.users.roles.update', $user), [
        'roles' => ['Creator', 'Moderator'],
    ]);

    $response->assertRedirect();

    $roles = $user->fresh()->getRoleNames()->sort()->values()->all();

    expect($roles)->toEqualCanonicalizing(['Creator', 'Moderator', 'User']);
});

test('super admin can update a user roles list', function () {
    $superAdmin = User::factory()->create();
    $superAdmin->assignRole('Super Admin');

    $user = User::factory()->create([
        'name' => 'Role Test Subject',
        'email' => 'subject2@example.com',
        'username' => 'subject2',
    ]);
    $user->assignRole('User');

    $response = $this->actingAs($superAdmin)->patch(route('admin.users.roles.update', $user), [
        'roles' => ['Creator', 'Moderator'],
    ]);

    $response->assertRedirect();

    $roles = $user->fresh()->getRoleNames()->sort()->values()->all();

    expect($roles)->toEqualCanonicalizing(['Creator', 'Moderator', 'User']);
});

test('admin cannot update their own roles', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $response = $this->actingAs($admin)->patch(route('admin.users.roles.update', $admin), [
        'roles' => ['Creator', 'Moderator'],
    ]);

    $response->assertForbidden();
});

test('admin cannot update other admin roles', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $otherAdmin = User::factory()->create();
    $otherAdmin->assignRole('Admin');

    $response = $this->actingAs($admin)->patch(route('admin.users.roles.update', $otherAdmin), [
        'roles' => ['Creator'],
    ]);

    $response->assertForbidden();
});

test('admin cannot update super admin roles', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $superAdmin = User::factory()->create();
    $superAdmin->assignRole('Super Admin');

    $response = $this->actingAs($admin)->patch(route('admin.users.roles.update', $superAdmin), [
        'roles' => ['Creator'],
    ]);

    $response->assertForbidden();
});

test('super admin can update admin roles', function () {
    $superAdmin = User::factory()->create();
    $superAdmin->assignRole('Super Admin');

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $response = $this->actingAs($superAdmin)->patch(route('admin.users.roles.update', $admin), [
        'roles' => ['Creator'],
    ]);

    $response->assertRedirect();

    $roles = $admin->fresh()->getRoleNames()->sort()->values()->all();

    expect($roles)->toEqualCanonicalizing(['Creator', 'User']);
});

test('non-admin users cannot access admin user management', function () {
    $user = User::factory()->create();
    $user->assignRole('User');

    $this->actingAs($user)
        ->get(route('admin.users.index'))
        ->assertForbidden();
});

test('non-admin users cannot update user roles', function () {
    $user = User::factory()->create();
    $user->assignRole('User');

    $targetUser = User::factory()->create();
    $targetUser->assignRole('User');

    $this->actingAs($user)
        ->patch(route('admin.users.roles.update', $targetUser), [
            'roles' => ['Creator'],
        ])
        ->assertForbidden();
});

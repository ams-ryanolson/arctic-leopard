<?php

use App\Enums\ActivityType;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Activitylog\Models\Activity;

test('guests cannot view the activity log', function () {
    $this->get(route('admin.activity-log.index'))->assertRedirect(route('login'));
});

test('users without admin permissions cannot view the activity log', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.activity-log.index'))
        ->assertRedirect(route('dashboard'));
});

test('admin role can view the activity log', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    // Create some test activities
    Activity::create([
        'log_name' => ActivityType::UserLogin->value,
        'description' => 'User logged in',
        'causer_type' => User::class,
        'causer_id' => $admin->id,
        'properties' => ['ip_address' => '127.0.0.1'],
    ]);

    $this->actingAs($admin)
        ->get(route('admin.activity-log.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ActivityLog/Index')
            ->has('activities.data')
            ->has('users')
            ->has('activityTypes')
        );
});

test('super admin role can view the activity log', function () {
    $superAdmin = User::factory()->create();
    $superAdmin->assignRole('Super Admin');

    $this->actingAs($superAdmin)
        ->get(route('admin.activity-log.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ActivityLog/Index')
        );
});

test('activity log can be filtered by search', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $user = User::factory()->create();

    Activity::create([
        'log_name' => ActivityType::UserLogin->value,
        'description' => 'User logged in successfully',
        'causer_type' => User::class,
        'causer_id' => $user->id,
        'properties' => [],
    ]);

    Activity::create([
        'log_name' => ActivityType::UserLogout->value,
        'description' => 'User logged out',
        'causer_type' => User::class,
        'causer_id' => $user->id,
        'properties' => [],
    ]);

    $this->actingAs($admin)
        ->get(route('admin.activity-log.index', ['search' => 'logged in']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ActivityLog/Index')
            ->where('filters.search', 'logged in')
            ->has('activities.data', 1)
            ->where('activities.data.0.description', 'User logged in successfully')
        );
});

test('activity log can be filtered by type', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $user = User::factory()->create();

    Activity::create([
        'log_name' => ActivityType::UserLogin->value,
        'description' => 'User logged in',
        'causer_type' => User::class,
        'causer_id' => $user->id,
        'properties' => [],
    ]);

    Activity::create([
        'log_name' => ActivityType::PasswordChanged->value,
        'description' => 'User changed password',
        'causer_type' => User::class,
        'causer_id' => $user->id,
        'properties' => [],
    ]);

    $this->actingAs($admin)
        ->get(route('admin.activity-log.index', ['type' => ActivityType::UserLogin->value]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ActivityLog/Index')
            ->where('filters.type', ActivityType::UserLogin->value)
            ->has('activities.data', 1)
            ->where('activities.data.0.log_name', ActivityType::UserLogin->value)
        );
});

test('activity log can be filtered by user', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    Activity::create([
        'log_name' => ActivityType::UserLogin->value,
        'description' => 'User 1 logged in',
        'causer_type' => User::class,
        'causer_id' => $user1->id,
        'properties' => [],
    ]);

    Activity::create([
        'log_name' => ActivityType::UserLogin->value,
        'description' => 'User 2 logged in',
        'causer_type' => User::class,
        'causer_id' => $user2->id,
        'properties' => [],
    ]);

    $this->actingAs($admin)
        ->get(route('admin.activity-log.index', ['user_id' => $user1->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ActivityLog/Index')
            ->where('filters.user_id', $user1->id)
            ->has('activities.data', 1)
            ->where('activities.data.0.causer.id', $user1->id)
        );
});

test('activity log can be filtered by date range', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $user = User::factory()->create();

    $yesterday = now()->subDay();
    $today = now();

    Activity::create([
        'log_name' => ActivityType::UserLogin->value,
        'description' => 'Yesterday login',
        'causer_type' => User::class,
        'causer_id' => $user->id,
        'properties' => [],
        'created_at' => $yesterday,
    ]);

    Activity::create([
        'log_name' => ActivityType::UserLogin->value,
        'description' => 'Today login',
        'causer_type' => User::class,
        'causer_id' => $user->id,
        'properties' => [],
        'created_at' => $today,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.activity-log.index', [
            'date_from' => $today->format('Y-m-d'),
            'date_to' => $today->format('Y-m-d'),
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ActivityLog/Index')
            ->where('filters.date_from', $today->format('Y-m-d'))
            ->where('filters.date_to', $today->format('Y-m-d'))
            ->has('activities.data', 1)
            ->where('activities.data.0.description', 'Today login')
        );
});

test('activity log displays user information correctly', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $user = User::factory()->create([
        'name' => 'Test User',
        'username' => 'testuser',
        'email' => 'test@example.com',
    ]);

    Activity::create([
        'log_name' => ActivityType::UserLogin->value,
        'description' => 'User logged in',
        'causer_type' => User::class,
        'causer_id' => $user->id,
        'properties' => [
            'ip_address' => '192.168.1.1',
            'user_agent' => 'Mozilla/5.0',
        ],
    ]);

    $this->actingAs($admin)
        ->get(route('admin.activity-log.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ActivityLog/Index')
            ->has('activities.data', 1)
            ->where('activities.data.0.causer.name', 'Test User')
            ->where('activities.data.0.causer.username', 'testuser')
            ->where('activities.data.0.causer.email', 'test@example.com')
            ->where('activities.data.0.ip_address', '192.168.1.1')
            ->where('activities.data.0.user_agent', 'Mozilla/5.0')
        );
});

test('activity log pagination works', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $user = User::factory()->create();

    // Create 20 activities
    for ($i = 0; $i < 20; $i++) {
        Activity::create([
            'log_name' => ActivityType::UserLogin->value,
            'description' => "Login {$i}",
            'causer_type' => User::class,
            'causer_id' => $user->id,
            'properties' => [],
        ]);
    }

    $this->actingAs($admin)
        ->get(route('admin.activity-log.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ActivityLog/Index')
            ->has('activities.data', 15) // Default pagination
            ->where('activities.meta.total', 20)
            ->where('activities.meta.current_page', 1)
        );

    // Test second page
    $this->actingAs($admin)
        ->get(route('admin.activity-log.index', ['page' => 2]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ActivityLog/Index')
            ->has('activities.data', 5) // Remaining 5 items
            ->where('activities.meta.current_page', 2)
        );
});

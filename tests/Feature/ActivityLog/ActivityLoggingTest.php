<?php

use App\Enums\ActivityType;
use App\Events\Memberships\MembershipUpgraded;
use App\Events\Payments\PaymentCaptured;
use App\Events\Payments\PaymentRefunded;
use App\Models\Memberships\MembershipPlan;
use App\Models\Memberships\UserMembership;
use App\Models\Payments\Payment;
use App\Models\Payments\Tip;
use App\Models\User;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Event;
use Laravel\Fortify\Events\TwoFactorAuthenticationEnabled;
use Spatie\Activitylog\Models\Activity;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

test('user login is logged', function () {
    $user = User::factory()->create();

    Event::dispatch(new Login('web', $user, false));

    $activity = Activity::query()
        ->where('log_name', ActivityType::UserLogin->value)
        ->where('causer_id', $user->id)
        ->first();

    expect($activity)->not->toBeNull()
        ->and($activity->description)->toContain($user->name)
        ->and($activity->description)->toContain('logged in');
});

test('user logout is logged', function () {
    $user = User::factory()->create();

    Event::dispatch(new Logout('web', $user));

    $activity = Activity::query()
        ->where('log_name', ActivityType::UserLogout->value)
        ->where('causer_id', $user->id)
        ->first();

    expect($activity)->not->toBeNull()
        ->and($activity->description)->toContain($user->name)
        ->and($activity->description)->toContain('logged out');
});

test('password change is logged', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->put(route('settings.security.password.update'), [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
        ->assertRedirect();

    $activity = Activity::query()
        ->where('log_name', ActivityType::PasswordChanged->value)
        ->where('causer_id', $user->id)
        ->first();

    expect($activity)->not->toBeNull()
        ->and($activity->description)->toContain($user->name)
        ->and($activity->description)->toContain('changed their password')
        ->and($activity->properties)->toHaveKey('timestamp');
});

test('two factor authentication enabled is logged', function () {
    $user = User::factory()->create();

    Event::dispatch(new TwoFactorAuthenticationEnabled($user));

    $activity = Activity::query()
        ->where('log_name', ActivityType::TwoFactorEnabled->value)
        ->where('causer_id', $user->id)
        ->first();

    expect($activity)->not->toBeNull()
        ->and($activity->description)->toContain($user->name)
        ->and($activity->description)->toContain('enabled two-factor authentication');
});

test('membership upgrade is logged', function () {
    $user = User::factory()->create();
    $oldPlan = MembershipPlan::factory()->create([
        'name' => 'Basic Plan',
        'slug' => 'basic-plan',
        'role_to_assign' => 'User',
    ]);
    $newPlan = MembershipPlan::factory()->create([
        'name' => 'Premium Plan',
        'slug' => 'premium-plan',
        'role_to_assign' => 'Gold',
    ]);

    $oldMembership = UserMembership::factory()->create([
        'user_id' => $user->id,
        'membership_plan_id' => $oldPlan->id,
    ]);
    $oldMembership->load('plan');

    $newMembership = UserMembership::factory()->create([
        'user_id' => $user->id,
        'membership_plan_id' => $newPlan->id,
    ]);
    $newMembership->load('plan');

    Event::dispatch(new MembershipUpgraded($oldMembership, $newMembership));

    $activity = Activity::query()
        ->where('log_name', ActivityType::MembershipUpgraded->value)
        ->where('causer_id', $user->id)
        ->first();

    expect($activity)->not->toBeNull()
        ->and($activity->description)->toContain('upgraded from')
        ->and($activity->description)->toContain('Basic Plan')
        ->and($activity->description)->toContain('Premium Plan')
        ->and($activity->properties)->toHaveKey('old_plan_name')
        ->and($activity->properties)->toHaveKey('new_plan_name');
});

test('role permissions change is logged', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $role = Role::create(['name' => 'Test Role']);
    $permission1 = Permission::create(['name' => 'permission1']);
    $permission2 = Permission::create(['name' => 'permission2']);
    $permission3 = Permission::create(['name' => 'permission3']);

    $role->givePermissionTo([$permission1, $permission2]);

    $this->actingAs($admin)
        ->patch(route('admin.roles.update', $role), [
            'permissions' => [$permission2->id, $permission3->id],
        ])
        ->assertRedirect();

    $activity = Activity::query()
        ->where('log_name', ActivityType::RolePermissionsChanged->value)
        ->where('causer_id', $admin->id)
        ->first();

    expect($activity)->not->toBeNull()
        ->and($activity->description)->toContain('Permissions changed for role')
        ->and($activity->properties)->toHaveKey('added_permissions')
        ->and($activity->properties)->toHaveKey('removed_permissions');
});

test('payment captured is logged for tip', function () {
    $user = User::factory()->create();
    $tip = Tip::factory()->create(['sender_id' => $user->id]);

    $payment = Payment::factory()->create([
        'payer_id' => $user->id,
        'payable_type' => Tip::class,
        'payable_id' => $tip->id,
    ]);

    Event::dispatch(new PaymentCaptured($payment));

    $activity = Activity::query()
        ->where('log_name', ActivityType::PurchaseTip->value)
        ->where('causer_id', $user->id)
        ->first();

    expect($activity)->not->toBeNull()
        ->and($activity->description)->toContain('purchased')
        ->and($activity->properties)->toHaveKey('payment_id')
        ->and($activity->properties)->toHaveKey('amount');
});

test('payment refunded is logged', function () {
    $user = User::factory()->create();
    $tip = Tip::factory()->create(['sender_id' => $user->id]);

    $payment = Payment::factory()->create([
        'payer_id' => $user->id,
        'payable_type' => Tip::class,
        'payable_id' => $tip->id,
    ]);

    Event::dispatch(new PaymentRefunded($payment, null));

    $activity = Activity::query()
        ->where('log_name', ActivityType::PaymentRefunded->value)
        ->where('causer_id', $user->id)
        ->first();

    expect($activity)->not->toBeNull()
        ->and($activity->description)->toContain('refunded');
});

test('activity log captures ip address and user agent', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withHeaders([
            'User-Agent' => 'Test Browser',
        ])
        ->put(route('settings.security.password.update'), [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $activity = Activity::query()
        ->where('log_name', ActivityType::PasswordChanged->value)
        ->where('causer_id', $user->id)
        ->first();

    expect($activity)->not->toBeNull()
        ->and($activity->properties)->toHaveKey('ip_address')
        ->and($activity->properties)->toHaveKey('user_agent')
        ->and($activity->properties['user_agent'])->toBe('Test Browser');
});

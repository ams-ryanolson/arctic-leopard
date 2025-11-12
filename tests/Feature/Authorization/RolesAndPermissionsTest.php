<?php

use App\Models\User;
use App\Models\Payments\PaymentSubscription;
use App\Enums\Payments\PaymentSubscriptionStatus;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function (): void {
    app(RolesAndPermissionsSeeder::class)->run();
});

it('seeds baseline roles with expected permissions', function (): void {
    $superAdmin = Role::findByName('Super Admin');
    $userRole = Role::findByName('User');
    $premiumRole = Role::findByName('Premium');

    expect($superAdmin->permissions)->toHaveCount(39);

    expect($userRole->permissions->pluck('name')->all())->toEqualCanonicalizing([
        'create posts',
        'upload media',
        'manage polls',
        'send tips',
        'flag content',
    ]);

    expect($premiumRole->permissions->pluck('name'))->toContain('hide ads');
    expect(Permission::pluck('name'))->toContain('view system posts');
});

it('evaluates access to creator content via permissions and subscriptions', function (): void {
    $creator = User::factory()->create();
    $creator->assignRole('Creator');

    $premiumViewer = User::factory()->create();
    $premiumViewer->assignRole('Premium');

    $basicViewer = User::factory()->create();
    $basicViewer->assignRole('User');

    expect(Gate::forUser($premiumViewer)->allows('access-creator-content', $creator))->toBeTrue();
    expect(Gate::forUser($basicViewer)->allows('access-creator-content', $creator))->toBeFalse();

    PaymentSubscription::factory()->create([
        'subscriber_id' => $basicViewer->id,
        'creator_id' => $creator->id,
        'status' => PaymentSubscriptionStatus::Active->value,
        'starts_at' => now(),
        'ends_at' => now()->addMonth(),
    ]);

    expect(Gate::forUser($basicViewer)->allows('access-creator-content', $creator))->toBeTrue();
});

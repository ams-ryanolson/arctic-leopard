<?php

use App\Enums\Payments\PaymentSubscriptionStatus;
use App\Models\Payments\PaymentSubscription;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

it('seeds baseline roles with expected permissions', function (): void {
    $superAdmin = Role::findByName('Super Admin');
    $userRole = Role::findByName('User');
    $bronzeRole = Role::findByName('Bronze');

    // Super Admin should have all permissions
    expect($superAdmin->permissions->count())->toBeGreaterThanOrEqual(30);

    expect($userRole->permissions->pluck('name')->all())->toEqualCanonicalizing([
        'create posts',
        'upload media',
        'manage polls',
        'send tips',
        'flag content',
    ]);

    // Bronze (and other paid tiers) should have 'hide ads' permission
    expect($bronzeRole->permissions->pluck('name'))->toContain('hide ads');
    expect(Permission::pluck('name'))->toContain('view system posts');
});

it('evaluates access to creator content via permissions and subscriptions', function (): void {
    $creator = User::factory()->create();
    $creator->assignRole('Creator');

    // Bronze tier user has paid membership benefits
    $paidViewer = User::factory()->create();
    $paidViewer->assignRole('Bronze');

    $basicViewer = User::factory()->create();
    $basicViewer->assignRole('User');

    expect(Gate::forUser($paidViewer)->allows('access-creator-content', $creator))->toBeTrue();
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

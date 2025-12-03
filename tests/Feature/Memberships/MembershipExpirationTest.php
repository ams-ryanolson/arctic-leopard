<?php

use App\Events\Memberships\MembershipExpired;
use App\Models\Memberships\MembershipPlan;
use App\Models\Memberships\UserMembership;
use App\Models\User;
use App\Services\Memberships\MembershipService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Queue::fake();
    Event::fake([MembershipExpired::class]);
});

it('expires membership and removes role when no other active memberships exist', function (): void {
    $user = User::factory()->create();

    $plan = MembershipPlan::factory()->create([
        'role_to_assign' => 'Gold',
    ]);

    $membership = UserMembership::factory()->create([
        'user_id' => $user->id,
        'membership_plan_id' => $plan->id,
        'status' => 'active',
        'ends_at' => now()->subDay(), // expired
    ]);

    $user->assignRole('Gold');
    expect($user->hasRole('Gold'))->toBeTrue();

    $service = app(MembershipService::class);
    $service->expire($membership);

    // Manually run the listener
    $listener = app(\App\Listeners\Memberships\RemoveRoleOnMembershipExpired::class);
    $listener->handle(new \App\Events\Memberships\MembershipExpired($membership));

    expect($membership->fresh()->status)->toBe('expired')
        ->and($user->fresh()->hasRole('Gold'))->toBeFalse();
});

it('does not remove role if user has another active membership with same role', function (): void {
    $user = User::factory()->create();

    $plan = MembershipPlan::factory()->create([
        'role_to_assign' => 'Gold',
    ]);

    $expiredMembership = UserMembership::factory()->create([
        'user_id' => $user->id,
        'membership_plan_id' => $plan->id,
        'status' => 'active',
        'ends_at' => now()->subDay(),
    ]);

    $activeMembership = UserMembership::factory()->create([
        'user_id' => $user->id,
        'membership_plan_id' => $plan->id,
        'status' => 'active',
        'ends_at' => now()->addMonth(),
    ]);

    $user->assignRole('Gold');

    $service = app(MembershipService::class);
    $service->expire($expiredMembership);

    $listener = new \App\Listeners\Memberships\RemoveRoleOnMembershipExpired(
        app(\App\Services\Memberships\MembershipService::class)
    );
    $listener->handle(new \App\Events\Memberships\MembershipExpired($expiredMembership));

    // Role should still be assigned because of active membership
    expect($user->fresh()->hasRole('Gold'))->toBeTrue();
});

it('never removes base User role', function (): void {
    $user = User::factory()->create();

    $plan = MembershipPlan::factory()->create([
        'role_to_assign' => 'User',
    ]);

    $membership = UserMembership::factory()->create([
        'user_id' => $user->id,
        'membership_plan_id' => $plan->id,
        'status' => 'active',
        'ends_at' => now()->subDay(),
    ]);

    $user->assignRole('User');

    $service = app(MembershipService::class);
    $service->expire($membership);

    $listener = new \App\Listeners\Memberships\RemoveRoleOnMembershipExpired(
        app(\App\Services\Memberships\MembershipService::class)
    );
    $listener->handle(new \App\Events\Memberships\MembershipExpired($membership));

    // User role should never be removed
    expect($user->fresh()->hasRole('User'))->toBeTrue();
});

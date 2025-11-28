<?php

use App\Events\Users\FreeMembershipGranted;
use App\Models\Memberships\MembershipPlan;
use App\Models\Memberships\UserMembership;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Event;

use function Pest\Laravel\actingAs;

it('allows admin to grant free membership to user', function (): void {
    Event::fake([FreeMembershipGranted::class]);

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $plan = MembershipPlan::factory()->create([
        'role_to_assign' => 'Member',
    ]);

    $user = User::factory()->create();
    $expiresAt = Carbon::now()->addMonths(3);

    actingAs($admin)
        ->post("/admin/users/{$user->id}/grant-free-membership", [
            'membership_plan_id' => $plan->id,
            'expires_at' => $expiresAt->toIso8601String(),
            'reason' => 'Promotional membership',
        ])
        ->assertRedirect();

    $membership = UserMembership::where('user_id', $user->id)->first();

    expect($membership)->not->toBeNull()
        ->and($membership->membership_plan_id)->toBe($plan->id)
        ->and($membership->status)->toBe('active')
        ->and($membership->ends_at->toIso8601String())->toBe($expiresAt->toIso8601String())
        ->and($membership->payment->amount)->toBe(0);

    Event::assertDispatched(FreeMembershipGranted::class, function ($event) use ($user, $membership, $admin): bool {
        return $event->user->id === $user->id
            && $event->membership->id === $membership->id
            && $event->admin->id === $admin->id;
    });
});

it('requires valid membership plan when granting free membership', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $user = User::factory()->create();

    actingAs($admin)
        ->post("/admin/users/{$user->id}/grant-free-membership", [
            'membership_plan_id' => 99999,
            'expires_at' => Carbon::now()->addMonth()->toIso8601String(),
        ])
        ->assertSessionHasErrors('membership_plan_id');
});

it('requires expiry date in future when granting free membership', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $plan = MembershipPlan::factory()->create();
    $user = User::factory()->create();

    actingAs($admin)
        ->post("/admin/users/{$user->id}/grant-free-membership", [
            'membership_plan_id' => $plan->id,
            'expires_at' => Carbon::now()->subDay()->toIso8601String(),
        ])
        ->assertSessionHasErrors('expires_at');
});

<?php

use App\Events\Memberships\MembershipUpgraded;
use App\Models\Memberships\MembershipPlan;
use App\Models\Memberships\UserMembership;
use App\Models\Payments\PaymentIntent;
use App\Models\User;
use App\Payments\Data\PaymentCaptureData;
use App\Payments\Gateways\FakeGateway;
use App\Services\Memberships\MembershipService;
use App\Services\Payments\PaymentService;
use App\ValueObjects\Money;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    FakeGateway::reset();
    Config::set('payments.default', 'fake');
    Queue::fake();
    Event::fake([MembershipUpgraded::class]);
});

it('calculates prorated upgrade price correctly', function (): void {
    $user = User::factory()->create();
    $premiumRole = Role::firstOrCreate(['name' => 'Premium', 'guard_name' => 'web']);
    $eliteRole = Role::firstOrCreate(['name' => 'Elite', 'guard_name' => 'web']);

    $premiumPlan = MembershipPlan::factory()->create([
        'name' => 'Premium',
        'role_to_assign' => 'Premium',
        'monthly_price' => 1000, // $10
    ]);

    $elitePlan = MembershipPlan::factory()->create([
        'name' => 'Elite',
        'role_to_assign' => 'Elite',
        'monthly_price' => 2000, // $20
    ]);

    $currentMembership = UserMembership::factory()->create([
        'user_id' => $user->id,
        'membership_plan_id' => $premiumPlan->id,
        'status' => 'active',
        'starts_at' => now()->subDays(15), // 15 days ago
        'ends_at' => now()->addDays(15), // 15 days remaining
        'original_price' => 1000,
        'billing_type' => 'recurring',
    ]);

    $this->actingAs($user);

    $membershipService = app(MembershipService::class);
    $upgradePrice = $membershipService->calculateUpgradePrice($currentMembership, $elitePlan, 'monthly');

    // Should be prorated: (1000 / 30) * 15 = 500 remaining value
    // Upgrade price: 2000 - 500 = 1500
    expect($upgradePrice)->toBe(1500);
});

it('upgrades membership and swaps roles', function (): void {
    $user = User::factory()->create();
    $premiumRole = Role::firstOrCreate(['name' => 'Premium', 'guard_name' => 'web']);
    $eliteRole = Role::firstOrCreate(['name' => 'Elite', 'guard_name' => 'web']);

    $premiumPlan = MembershipPlan::factory()->create([
        'name' => 'Premium',
        'role_to_assign' => 'Premium',
        'monthly_price' => 1000,
    ]);

    $elitePlan = MembershipPlan::factory()->create([
        'name' => 'Elite',
        'role_to_assign' => 'Elite',
        'monthly_price' => 2000,
    ]);

    $currentMembership = UserMembership::factory()->create([
        'user_id' => $user->id,
        'membership_plan_id' => $premiumPlan->id,
        'status' => 'active',
        'starts_at' => now()->subDays(15),
        'ends_at' => now()->addDays(15),
        'original_price' => 1000,
        'billing_type' => 'recurring',
    ]);

    $user->assignRole('Premium');
    expect($user->hasRole('Premium'))->toBeTrue();

    $this->actingAs($user);

    $response = $this->post(route('memberships.upgrade', $currentMembership), [
        'plan_id' => $elitePlan->id,
        'billing_type' => 'recurring',
        'billing_interval' => 'monthly',
        'gateway' => 'fake',
        'method' => 'card',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['payment_intent', 'upgrade_price', 'original_upgrade_price', 'discount_amount']);

    $intentData = $response->json('payment_intent');
    $intent = PaymentIntent::query()->findOrFail($intentData['id']);

    $payment = app(PaymentService::class)->capture(
        $intent,
        new PaymentCaptureData(
            providerIntentId: $intent->provider_intent_id,
            amount: Money::from(1500, 'USD')
        )
    );

    $listener = app(\App\Listeners\Payments\CreateMembershipOnPaymentCaptured::class);
    $listener->handle(new \App\Events\Payments\PaymentCaptured($payment));

    $user->refresh();

    expect($currentMembership->fresh()->status)->toBe('cancelled')
        ->and($currentMembership->fresh()->cancellation_reason)->toBe('upgraded')
        ->and(UserMembership::query()
            ->where('user_id', $user->id)
            ->where('membership_plan_id', $elitePlan->id)
            ->where('status', 'active')
            ->exists())->toBeTrue()
        ->and($user->hasRole('Elite'))->toBeTrue()
        ->and($user->hasRole('Premium'))->toBeFalse();
});

it('keeps same expiry date when upgrading', function (): void {
    $user = User::factory()->create();
    $premiumPlan = MembershipPlan::factory()->create(['monthly_price' => 1000]);
    $elitePlan = MembershipPlan::factory()->create(['monthly_price' => 2000]);

    $currentMembership = UserMembership::factory()->create([
        'user_id' => $user->id,
        'membership_plan_id' => $premiumPlan->id,
        'status' => 'active',
        'ends_at' => now()->addDays(15),
        'original_price' => 1000,
    ]);

    $this->actingAs($user);

    $response = $this->post(route('memberships.upgrade', $currentMembership), [
        'plan_id' => $elitePlan->id,
        'billing_type' => 'recurring',
        'billing_interval' => 'monthly',
        'gateway' => 'fake',
        'method' => 'card',
    ]);

    $response->assertCreated();

    $intentData = $response->json('payment_intent');
    $intent = PaymentIntent::query()->findOrFail($intentData['id']);

    $payment = app(PaymentService::class)->capture(
        $intent,
        new PaymentCaptureData(
            providerIntentId: $intent->provider_intent_id,
            amount: Money::from(1500, 'USD')
        )
    );

    $listener = app(\App\Listeners\Payments\CreateMembershipOnPaymentCaptured::class);
    $listener->handle(new \App\Events\Payments\PaymentCaptured($payment));

    $newMembership = UserMembership::query()
        ->where('user_id', $user->id)
        ->where('membership_plan_id', $elitePlan->id)
        ->where('status', 'active')
        ->first();

    expect($newMembership)->not->toBeNull()
        ->and($newMembership->ends_at->format('Y-m-d'))->toBe($currentMembership->ends_at->format('Y-m-d'));
});

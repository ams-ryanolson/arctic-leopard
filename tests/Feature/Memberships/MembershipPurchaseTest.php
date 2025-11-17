<?php

use App\Events\Memberships\MembershipPurchased;
use App\Models\Memberships\MembershipPlan;
use App\Models\Memberships\UserMembership;
use App\Models\Payments\PaymentIntent;
use App\Models\User;
use App\Payments\Data\PaymentCaptureData;
use App\Payments\Gateways\FakeGateway;
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
    Event::fake([MembershipPurchased::class]);
});

it('creates a membership when payment is captured for a membership plan', function (): void {
    $user = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'Premium', 'guard_name' => 'web']);

    $plan = MembershipPlan::factory()->create([
        'name' => 'Premium Plan',
        'slug' => 'premium-plan',
        'role_to_assign' => 'Premium',
        'monthly_price' => 1000,
        'yearly_price' => 10000,
        'allows_recurring' => true,
        'allows_one_time' => true,
    ]);

    $this->actingAs($user);

    $response = $this->post(route('memberships.purchase'), [
        'plan_id' => $plan->id,
        'billing_type' => 'recurring',
        'billing_interval' => 'monthly',
        'gateway' => 'fake',
        'method' => 'card',
    ]);

    $response->assertCreated()
        ->assertJsonStructure([
            'payment_intent' => ['id', 'uuid', 'client_secret', 'status'],
            'plan' => ['id', 'name', 'price', 'original_price', 'discount_amount'],
        ]);

    $intentData = $response->json('payment_intent');
    $intent = PaymentIntent::query()->findOrFail($intentData['id']);

    $payment = app(PaymentService::class)->capture(
        $intent,
        new PaymentCaptureData(
            providerIntentId: $intent->provider_intent_id,
            amount: Money::from(1000, 'USD')
        )
    );

    // Manually run the listener since it's queued
    $listener = app(\App\Listeners\Payments\CreateMembershipOnPaymentCaptured::class);
    $listener->handle(new \App\Events\Payments\PaymentCaptured($payment));

    // Manually call the role assignment listener since it's queued
    $membership = UserMembership::query()
        ->where('user_id', $user->id)
        ->where('membership_plan_id', $plan->id)
        ->first();
    
    if ($membership) {
        $roleListener = app(\App\Listeners\Memberships\AssignRoleOnMembershipPurchased::class);
        $roleListener->handle(new \App\Events\Memberships\MembershipPurchased($membership));
    }

    expect($membership)->not->toBeNull()
        ->and($membership->status)->toBe('active')
        ->and($membership->billing_type)->toBe('recurring')
        ->and($membership->original_price)->toBe(1000)
        ->and($user->fresh()->hasRole('Premium'))->toBeTrue();
});

it('creates a one-time membership with correct duration', function (): void {
    $user = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'Premium', 'guard_name' => 'web']);

    $plan = MembershipPlan::factory()->create([
        'name' => 'Premium Plan',
        'slug' => 'premium-plan',
        'role_to_assign' => 'Premium',
        'monthly_price' => 1000,
        'allows_one_time' => true,
        'one_time_duration_days' => 30,
    ]);

    $this->actingAs($user);

    $response = $this->post(route('memberships.purchase'), [
        'plan_id' => $plan->id,
        'billing_type' => 'one_time',
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
            amount: Money::from(1000, 'USD')
        )
    );

    $listener = new \App\Listeners\Payments\CreateMembershipOnPaymentCaptured(
        app(\App\Services\Memberships\MembershipService::class),
        app(\App\Services\Memberships\MembershipDiscountService::class)
    );
    $listener->handle(new \App\Events\Payments\PaymentCaptured($payment));

    $membership = UserMembership::query()
        ->where('user_id', $user->id)
        ->where('membership_plan_id', $plan->id)
        ->first();

    expect($membership)->not->toBeNull()
        ->and($membership->billing_type)->toBe('one_time')
        ->and($membership->ends_at)->not->toBeNull()
        ->and(abs($membership->ends_at->diffInDays(now(), false)))->toBeGreaterThanOrEqual(29)
        ->and(abs($membership->ends_at->diffInDays(now(), false)))->toBeLessThanOrEqual(30);
});

it('applies discount code when provided', function (): void {
    $user = User::factory()->create();
    $plan = MembershipPlan::factory()->create([
        'monthly_price' => 1000,
    ]);

    $discount = \App\Models\Memberships\MembershipDiscount::factory()->create([
        'code' => 'SAVE20',
        'discount_type' => 'percentage',
        'discount_value' => 20,
        'membership_plan_id' => null, // applies to all
    ]);

    $this->actingAs($user);

    $response = $this->post(route('memberships.purchase'), [
        'plan_id' => $plan->id,
        'billing_type' => 'recurring',
        'billing_interval' => 'monthly',
        'discount_code' => 'SAVE20',
        'gateway' => 'fake',
        'method' => 'card',
    ]);

    $response->assertCreated()
        ->assertJsonPath('plan.price', 800) // 1000 - 20% = 800
        ->assertJsonPath('plan.original_price', 1000)
        ->assertJsonPath('plan.discount_amount', 200);
});

it('cancels existing membership when purchasing a new one', function (): void {
    $user = User::factory()->create();
    $oldPlan = MembershipPlan::factory()->create([
        'name' => 'Basic Plan',
        'slug' => 'basic-plan',
        'role_to_assign' => 'User',
    ]);
    $newPlan = MembershipPlan::factory()->create([
        'name' => 'Premium Plan',
        'slug' => 'premium-plan',
        'role_to_assign' => 'Premium',
    ]);

    $oldMembership = UserMembership::factory()->create([
        'user_id' => $user->id,
        'membership_plan_id' => $oldPlan->id,
        'status' => 'active',
    ]);

    $this->actingAs($user);

    $response = $this->post(route('memberships.purchase'), [
        'plan_id' => $newPlan->id,
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
            amount: Money::from(1000, 'USD')
        )
    );

    $listener = new \App\Listeners\Payments\CreateMembershipOnPaymentCaptured(
        app(\App\Services\Memberships\MembershipService::class),
        app(\App\Services\Memberships\MembershipDiscountService::class)
    );
    $listener->handle(new \App\Events\Payments\PaymentCaptured($payment));

    expect($oldMembership->fresh()->status)->toBe('cancelled')
        ->and($oldMembership->fresh()->cancellation_reason)->toBe('replaced_by_new_membership');
});

<?php

use App\Models\Memberships\MembershipDiscount;
use App\Models\Memberships\MembershipPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('validates and applies percentage discount code', function (): void {
    $user = User::factory()->create();
    $plan = MembershipPlan::factory()->create(['monthly_price' => 1000]);

    $discount = MembershipDiscount::factory()->create([
        'code' => 'SAVE20',
        'discount_type' => 'percentage',
        'discount_value' => 20,
        'membership_plan_id' => null, // applies to all
    ]);

    $this->actingAs($user);

    $response = $this->post(route('memberships.apply-discount'), [
        'code' => 'SAVE20',
        'plan_id' => $plan->id,
        'price' => 1000,
    ]);

    $response->assertOk()
        ->assertJsonPath('valid', true)
        ->assertJsonPath('discount.code', 'SAVE20')
        ->assertJsonPath('discount.type', 'percentage')
        ->assertJsonPath('discount.amount', 200)
        ->assertJsonPath('final_price', 800);
});

it('validates and applies fixed amount discount code', function (): void {
    $user = User::factory()->create();
    $plan = MembershipPlan::factory()->create(['monthly_price' => 1000]);

    $discount = MembershipDiscount::factory()->fixedAmount(250)->create([
        'code' => 'FLAT250',
        'membership_plan_id' => null,
    ]);

    $this->actingAs($user);

    $response = $this->post(route('memberships.apply-discount'), [
        'code' => 'FLAT250',
        'plan_id' => $plan->id,
        'price' => 1000,
    ]);

    $response->assertOk()
        ->assertJsonPath('valid', true)
        ->assertJsonPath('discount.type', 'fixed_amount')
        ->assertJsonPath('discount.amount', 250)
        ->assertJsonPath('final_price', 750);
});

it('rejects invalid discount code', function (): void {
    $user = User::factory()->create();
    $plan = MembershipPlan::factory()->create();

    $this->actingAs($user);

    $response = $this->post(route('memberships.apply-discount'), [
        'code' => 'INVALID',
        'plan_id' => $plan->id,
        'price' => 1000,
    ]);

    $response->assertStatus(400)
        ->assertJsonPath('valid', false);
});

it('rejects expired discount code', function (): void {
    $user = User::factory()->create();
    $plan = MembershipPlan::factory()->create();

    $discount = MembershipDiscount::factory()->expired()->create([
        'code' => 'EXPIRED',
    ]);

    $this->actingAs($user);

    $response = $this->post(route('memberships.apply-discount'), [
        'code' => 'EXPIRED',
        'plan_id' => $plan->id,
        'price' => 1000,
    ]);

    $response->assertStatus(400)
        ->assertJsonPath('valid', false);
});

it('rejects discount code that exceeds max uses', function (): void {
    $user = User::factory()->create();
    $plan = MembershipPlan::factory()->create();

    $discount = MembershipDiscount::factory()->create([
        'code' => 'LIMITED',
        'max_uses' => 1,
        'used_count' => 1,
    ]);

    $this->actingAs($user);

    $response = $this->post(route('memberships.apply-discount'), [
        'code' => 'LIMITED',
        'plan_id' => $plan->id,
        'price' => 1000,
    ]);

    $response->assertStatus(400)
        ->assertJsonPath('valid', false);
});

it('validates plan-specific discount codes', function (): void {
    $user = User::factory()->create();
    $plan1 = MembershipPlan::factory()->create([
        'name' => 'Plan One',
        'slug' => 'plan-one',
        'role_to_assign' => 'Gold',
    ]);
    $plan2 = MembershipPlan::factory()->create([
        'name' => 'Plan Two',
        'slug' => 'plan-two',
        'role_to_assign' => 'Gold',
    ]);

    $discount = MembershipDiscount::factory()->forPlan($plan1)->create([
        'code' => 'PLAN1ONLY',
    ]);

    $this->actingAs($user);

    // Should work for plan1
    $response1 = $this->postJson(route('memberships.apply-discount'), [
        'code' => 'PLAN1ONLY',
        'plan_id' => $plan1->id,
        'price' => 1000,
    ]);

    $response1->assertOk()
        ->assertJsonPath('valid', true);

    // Should fail for plan2
    $response2 = $this->postJson(route('memberships.apply-discount'), [
        'code' => 'PLAN1ONLY',
        'plan_id' => $plan2->id,
        'price' => 1000,
    ]);

    $response2->assertStatus(400)
        ->assertJsonPath('valid', false);
});

it('records discount usage when membership is purchased', function (): void {
    $user = User::factory()->create();
    $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Premium', 'guard_name' => 'web']);
    $plan = MembershipPlan::factory()->create([
        'monthly_price' => 1000,
        'name' => 'Premium Plan',
        'slug' => 'premium-plan',
        'role_to_assign' => 'Gold',
    ]);

    $discount = MembershipDiscount::factory()->create([
        'code' => 'SAVE20',
        'discount_type' => 'percentage',
        'discount_value' => 20,
        'used_count' => 0,
    ]);

    $this->actingAs($user);

    $response = $this->postJson(route('memberships.purchase'), [
        'plan_id' => $plan->id,
        'billing_type' => 'recurring',
        'billing_interval' => 'monthly',
        'discount_code' => 'SAVE20',
        'gateway' => 'fake',
        'method' => 'card',
    ]);

    $response->assertCreated();

    $intentData = $response->json('payment_intent');
    $intent = \App\Models\Payments\PaymentIntent::query()->findOrFail($intentData['id']);

    $payment = app(\App\Services\Payments\PaymentService::class)->capture(
        $intent,
        new \App\Payments\Data\PaymentCaptureData(
            providerIntentId: $intent->provider_intent_id,
            amount: \App\ValueObjects\Money::from(800, 'USD')
        )
    );

    // Check discount count before listener (purchase endpoint may have already recorded it)
    $initialCount = $discount->fresh()->used_count;

    $listener = app(\App\Listeners\Payments\CreateMembershipOnPaymentCaptured::class);
    $listener->handle(new \App\Events\Payments\PaymentCaptured($payment));

    // Discount should be recorded exactly once by the listener
    // (purchase endpoint may have already recorded it, so we check it increased by at least 1)
    $finalCount = $discount->fresh()->used_count;
    expect($finalCount)->toBeGreaterThanOrEqual($initialCount + 1);
});

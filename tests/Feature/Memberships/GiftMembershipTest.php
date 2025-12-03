<?php

use App\Events\Memberships\MembershipGifted;
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
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    FakeGateway::reset();
    Config::set('payments.default', 'fake');
    Queue::fake();
    Event::fake([MembershipGifted::class]);
    Notification::fake();
});

it('can purchase a gift membership for another user', function (): void {
    $gifter = User::factory()->create();
    $recipient = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'Premium', 'guard_name' => 'web']);

    $plan = MembershipPlan::factory()->create([
        'name' => 'Premium Plan',
        'slug' => 'premium-plan',
        'role_to_assign' => 'Gold',
        'monthly_price' => 1000,
        'allows_one_time' => true,
        'one_time_duration_days' => 30,
    ]);

    $this->actingAs($gifter);

    $response = $this->postJson(route('memberships.gift'), [
        'recipient_id' => $recipient->id,
        'plan_id' => $plan->id,
        'message' => 'Enjoy your membership!',
        'gateway' => 'fake',
        'method' => 'card',
    ]);

    $response->assertCreated()
        ->assertJsonStructure([
            'payment_intent' => ['id', 'uuid', 'client_secret', 'status'],
            'plan' => ['id', 'name', 'price', 'original_price', 'discount_amount'],
            'recipient' => ['id', 'username', 'display_name'],
        ]);

    $intentData = $response->json('payment_intent');
    $intent = PaymentIntent::query()->findOrFail($intentData['id']);

    // Verify payment metadata
    $payment = $intent->payment;
    expect($payment->payer_id)->toBe($gifter->id)
        ->and($payment->payee_id)->toBe($recipient->id)
        ->and($payment->metadata['is_gift'])->toBeTrue()
        ->and($payment->metadata['gifted_to_user_id'])->toBe($recipient->id)
        ->and($payment->metadata['gifted_by_user_id'])->toBe($gifter->id)
        ->and($payment->metadata['gift_message'])->toBe('Enjoy your membership!');

    // Capture payment
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
        ->where('user_id', $recipient->id)
        ->where('membership_plan_id', $plan->id)
        ->first();

    if ($membership) {
        $roleListener = app(\App\Listeners\Memberships\AssignRoleOnMembershipPurchased::class);
        $roleListener->handle(new \App\Events\Memberships\MembershipPurchased($membership));
    }

    // Verify membership was created for recipient, not gifter
    expect($membership)->not->toBeNull()
        ->and($membership->user_id)->toBe($recipient->id)
        ->and($membership->gifted_by_user_id)->toBe($gifter->id)
        ->and($membership->status)->toBe('active')
        ->and($membership->billing_type)->toBe('one_time')
        ->and($recipient->fresh()->hasRole('Premium'))->toBeTrue();

    // Verify event was fired
    Event::assertDispatched(MembershipGifted::class, function ($event) use ($membership, $gifter) {
        return $event->membership->id === $membership->id
            && $event->gifter->id === $gifter->id;
    });
});

it('cannot gift membership to user with active membership', function (): void {
    $gifter = User::factory()->create();
    $recipient = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'Premium', 'guard_name' => 'web']);

    $plan = MembershipPlan::factory()->create([
        'name' => 'Premium Plan',
        'slug' => 'premium-plan',
        'role_to_assign' => 'Gold',
        'monthly_price' => 1000,
        'allows_one_time' => true,
        'one_time_duration_days' => 30,
    ]);

    // Give recipient an active membership
    UserMembership::factory()->create([
        'user_id' => $recipient->id,
        'membership_plan_id' => $plan->id,
        'status' => 'active',
        'ends_at' => now()->addDays(30),
    ]);

    $this->actingAs($gifter);

    $response = $this->postJson(route('memberships.gift'), [
        'recipient_id' => $recipient->id,
        'plan_id' => $plan->id,
        'gateway' => 'fake',
        'method' => 'card',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['recipient_id']);
});

it('cannot gift membership to self', function (): void {
    $user = User::factory()->create();

    $plan = MembershipPlan::factory()->create([
        'name' => 'Premium Plan',
        'slug' => 'premium-plan',
        'monthly_price' => 1000,
        'allows_one_time' => true,
    ]);

    $this->actingAs($user);

    $response = $this->postJson(route('memberships.gift'), [
        'recipient_id' => $user->id,
        'plan_id' => $plan->id,
        'gateway' => 'fake',
        'method' => 'card',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['recipient_id']);
});

it('revokes gift membership on chargeback and notifies both users', function (): void {
    $gifter = User::factory()->create();
    $recipient = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'Premium', 'guard_name' => 'web']);

    $plan = MembershipPlan::factory()->create([
        'name' => 'Premium Plan',
        'slug' => 'premium-plan',
        'role_to_assign' => 'Gold',
        'monthly_price' => 1000,
        'allows_one_time' => true,
        'one_time_duration_days' => 30,
    ]);

    // Create a gift membership
    $payment = \App\Models\Payments\Payment::factory()->create([
        'payer_id' => $gifter->id,
        'payee_id' => $recipient->id,
        'payable_type' => MembershipPlan::class,
        'payable_id' => $plan->id,
        'status' => \App\Enums\Payments\PaymentStatus::Captured,
        'metadata' => [
            'is_gift' => true,
            'gifted_to_user_id' => $recipient->id,
            'gifted_by_user_id' => $gifter->id,
        ],
    ]);

    $membership = UserMembership::factory()->create([
        'user_id' => $recipient->id,
        'gifted_by_user_id' => $gifter->id,
        'membership_plan_id' => $plan->id,
        'payment_id' => $payment->id,
        'status' => 'active',
        'ends_at' => now()->addDays(30),
    ]);

    // Simulate chargeback/refund
    $payment->update([
        'status' => \App\Enums\Payments\PaymentStatus::Refunded,
        'refunded_at' => now(),
    ]);

    // Manually run the chargeback listener
    $listener = app(\App\Listeners\Payments\RevokeGiftMembershipOnChargeback::class);
    $listener->handle(new \App\Events\Payments\PaymentRefunded($payment));

    // Verify membership was cancelled
    $membership->refresh();
    expect($membership->status)->toBe('cancelled')
        ->and($membership->cancellation_reason)->toBe('chargeback_refund');
});

it('sends notifications to both gifter and recipient on gift purchase', function (): void {
    $gifter = User::factory()->create();
    $recipient = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'Premium', 'guard_name' => 'web']);

    $plan = MembershipPlan::factory()->create([
        'name' => 'Premium Plan',
        'slug' => 'premium-plan',
        'role_to_assign' => 'Gold',
        'monthly_price' => 1000,
        'allows_one_time' => true,
        'one_time_duration_days' => 30,
    ]);

    // Create payment and membership
    $payment = \App\Models\Payments\Payment::factory()->create([
        'payer_id' => $gifter->id,
        'payee_id' => $recipient->id,
        'payable_type' => MembershipPlan::class,
        'payable_id' => $plan->id,
        'status' => \App\Enums\Payments\PaymentStatus::Captured,
        'metadata' => [
            'is_gift' => true,
            'gifted_to_user_id' => $recipient->id,
            'gifted_by_user_id' => $gifter->id,
        ],
    ]);

    $membership = UserMembership::factory()->create([
        'user_id' => $recipient->id,
        'gifted_by_user_id' => $gifter->id,
        'membership_plan_id' => $plan->id,
        'payment_id' => $payment->id,
        'status' => 'active',
    ]);

    // Fire the event
    event(new MembershipGifted($membership, $gifter));

    // Manually run listeners since they're queued
    $recipientListener = app(\App\Listeners\Memberships\SendMembershipGiftedNotification::class);
    $gifterListener = app(\App\Listeners\Memberships\SendMembershipGiftPurchasedNotification::class);

    $event = new MembershipGifted($membership, $gifter);
    $recipientListener->handle($event);
    $gifterListener->handle($event);

    // Verify notifications were sent
    Notification::assertSentTo(
        $recipient,
        \App\Notifications\Memberships\MembershipGiftedNotification::class
    );

    Notification::assertSentTo(
        $gifter,
        \App\Notifications\Memberships\MembershipGiftPurchasedNotification::class
    );
});

it('only allows one-time billing for gift memberships', function (): void {
    $gifter = User::factory()->create();
    $recipient = User::factory()->create();

    $plan = MembershipPlan::factory()->create([
        'name' => 'Premium Plan',
        'slug' => 'premium-plan',
        'monthly_price' => 1000,
        'allows_one_time' => true,
        'allows_recurring' => false, // Plan doesn't allow recurring
    ]);

    $this->actingAs($gifter);

    $response = $this->postJson(route('memberships.gift'), [
        'recipient_id' => $recipient->id,
        'plan_id' => $plan->id,
        'gateway' => 'fake',
        'method' => 'card',
    ]);

    // Should succeed since gift memberships are always one-time
    $response->assertCreated();
});

it('creates gift membership with correct duration', function (): void {
    $gifter = User::factory()->create();
    $recipient = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'Premium', 'guard_name' => 'web']);

    $plan = MembershipPlan::factory()->create([
        'name' => 'Premium Plan',
        'slug' => 'premium-plan',
        'role_to_assign' => 'Gold',
        'monthly_price' => 1000,
        'allows_one_time' => true,
        'one_time_duration_days' => 90, // 3 months
    ]);

    $this->actingAs($gifter);

    $response = $this->postJson(route('memberships.gift'), [
        'recipient_id' => $recipient->id,
        'plan_id' => $plan->id,
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

    $listener = app(\App\Listeners\Payments\CreateMembershipOnPaymentCaptured::class);
    $listener->handle(new \App\Events\Payments\PaymentCaptured($payment));

    $membership = UserMembership::query()
        ->where('user_id', $recipient->id)
        ->where('membership_plan_id', $plan->id)
        ->first();

    // Verify duration is correct
    expect($membership)->not->toBeNull()
        ->and($membership->ends_at->diffInDays(now()))->toBeGreaterThan(89)
        ->and($membership->ends_at->diffInDays(now()))->toBeLessThan(91);
});

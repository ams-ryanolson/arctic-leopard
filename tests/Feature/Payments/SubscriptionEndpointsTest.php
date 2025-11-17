<?php

use App\Enums\Payments\PaymentSubscriptionStatus;
use App\Models\Payments\PaymentSubscription;
use App\Models\Payments\SubscriptionPlan;
use App\Models\User;
use App\Payments\Gateways\FakeGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    FakeGateway::reset();
    Config::set('payments.default', 'fake');
});

it('creates a subscription and accompanying payment intent via the API', function (): void {
    $creator = User::factory()->create();
    $subscriber = User::factory()->create();

    $plan = SubscriptionPlan::factory()->create([
        'creator_id' => $creator->id,
        'amount' => 1500,
        'currency' => 'USD',
        'interval' => 'monthly',
    ]);

    Sanctum::actingAs($subscriber);

    $response = $this->postJson(route('subscriptions.store'), [
        'plan_id' => $plan->id,
        'auto_renews' => true,
        'method' => 'card',
        'metadata' => ['source' => 'test'],
    ]);

    $response->assertCreated()
        ->assertJsonPath('subscription.subscriber_id', $subscriber->id)
        ->assertJsonPath('subscription.creator_id', $creator->id)
        ->assertJsonStructure(['subscription' => ['id'], 'payment_intent' => ['id']]);

    expect(PaymentSubscription::query()->count())->toBe(1);
});

it('cancels a subscription through the API', function (): void {
    $creator = User::factory()->create();
    $subscriber = User::factory()->create();

    $plan = SubscriptionPlan::factory()->create([
        'creator_id' => $creator->id,
        'amount' => 2500,
        'currency' => 'USD',
        'interval' => 'monthly',
    ]);

    Sanctum::actingAs($subscriber);

    $subscriptionId = (int) $this->postJson(route('subscriptions.store'), [
        'plan_id' => $plan->id,
    ])->json('subscription.id');

    $subscription = PaymentSubscription::query()->findOrFail($subscriptionId);

    $this->deleteJson(route('subscriptions.destroy', $subscription))
        ->assertNoContent();

    expect($subscription->refresh()->auto_renews)->toBeFalse();
});

it('resumes a cancelled subscription', function (): void {
    $creator = User::factory()->create();
    $subscriber = User::factory()->create();

    $plan = SubscriptionPlan::factory()->create([
        'creator_id' => $creator->id,
    ]);

    Sanctum::actingAs($subscriber);

    $subscriptionId = (int) $this->postJson(route('subscriptions.store'), [
        'plan_id' => $plan->id,
    ])->json('subscription.id');

    $subscription = PaymentSubscription::query()->findOrFail($subscriptionId);
    $subscription->update([
        'status' => PaymentSubscriptionStatus::Cancelled,
        'auto_renews' => false,
    ]);

    $this->postJson(route('subscriptions.resume', $subscription), [
        'payment_method_token' => 'pm_test',
    ])->assertOk()
        ->assertJsonPath('status', PaymentSubscriptionStatus::Active->value);
});

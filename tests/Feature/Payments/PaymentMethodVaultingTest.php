<?php

use App\Models\Payments\PaymentMethod;
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

it('lists user payment methods via API', function (): void {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    PaymentMethod::factory()->count(3)->create([
        'user_id' => $user->id,
        'provider' => 'fake',
    ]);

    $response = $this->getJson(route('payment-methods.index'));

    $response->assertSuccessful()
        ->assertJsonCount(3)
        ->assertJsonStructure([
            '*' => ['id', 'brand', 'last_four', 'exp_month', 'exp_year', 'is_default'],
        ]);
});

it('vaults a payment token via API', function (): void {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $response = $this->postJson(route('payment-methods.store'), [
        'provider_token_id' => 'tok_test_12345',
        'gateway' => 'fake',
        'is_default' => true,
    ]);

    $response->assertCreated()
        ->assertJsonStructure([
            'id',
            'provider',
            'provider_method_id',
            'brand',
            'last_four',
            'is_default',
        ]);

    expect(PaymentMethod::query()->where('user_id', $user->id)->count())->toBe(1)
        ->and((bool) PaymentMethod::query()->where('user_id', $user->id)->first()->is_default)->toBeTrue();
});

it('sets first payment method as default automatically', function (): void {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $response = $this->postJson(route('payment-methods.store'), [
        'provider_token_id' => 'tok_test_12345',
        'gateway' => 'fake',
    ]);

    $response->assertCreated();

    $paymentMethod = PaymentMethod::query()->where('user_id', $user->id)->first();
    expect((bool) $paymentMethod->is_default)->toBeTrue();
});

it('does not set second payment method as default automatically', function (): void {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    // Create first payment method (should be default)
    $this->postJson(route('payment-methods.store'), [
        'provider_token_id' => 'tok_test_11111',
        'gateway' => 'fake',
    ]);

    // Create second payment method (should NOT be default)
    $response = $this->postJson(route('payment-methods.store'), [
        'provider_token_id' => 'tok_test_22222',
        'gateway' => 'fake',
    ]);

    $response->assertCreated();

    $methods = PaymentMethod::query()->where('user_id', $user->id)->get();
    expect($methods->count())->toBe(2)
        ->and($methods->where('is_default', true)->count())->toBe(1)
        ->and((bool) $methods->first()->is_default)->toBeTrue()
        ->and((bool) $methods->last()->is_default)->toBeFalse();
});

it('deletes a payment method via API', function (): void {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $paymentMethod = PaymentMethod::factory()->create([
        'user_id' => $user->id,
        'provider' => 'fake',
    ]);

    $response = $this->deleteJson(route('payment-methods.destroy', $paymentMethod));

    $response->assertNoContent();

    expect(PaymentMethod::query()->find($paymentMethod->id))->toBeNull();
});

it('prevents deleting other users payment methods', function (): void {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    Sanctum::actingAs($user);

    $paymentMethod = PaymentMethod::factory()->create([
        'user_id' => $otherUser->id,
        'provider' => 'fake',
    ]);

    $response = $this->deleteJson(route('payment-methods.destroy', $paymentMethod));

    $response->assertNotFound();

    expect(PaymentMethod::query()->find($paymentMethod->id))->not->toBeNull();
});

it('sets a payment method as default via API', function (): void {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $method1 = PaymentMethod::factory()->create([
        'user_id' => $user->id,
        'is_default' => true,
        'provider' => 'fake',
    ]);

    $method2 = PaymentMethod::factory()->create([
        'user_id' => $user->id,
        'is_default' => false,
        'provider' => 'fake',
    ]);

    $response = $this->postJson(route('payment-methods.set-default', $method2));

    $response->assertSuccessful();

    $method1->refresh();
    $method2->refresh();

    expect((bool) $method1->is_default)->toBeFalse()
        ->and((bool) $method2->is_default)->toBeTrue();
});

it('prevents setting other users payment methods as default', function (): void {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    Sanctum::actingAs($user);

    $paymentMethod = PaymentMethod::factory()->create([
        'user_id' => $otherUser->id,
        'provider' => 'fake',
    ]);

    $response = $this->postJson(route('payment-methods.set-default', $paymentMethod));

    $response->assertNotFound();
});

it('requires authentication to list payment methods', function (): void {
    $response = $this->getJson(route('payment-methods.index'));

    $response->assertUnauthorized();
});

it('requires authentication to vault payment token', function (): void {
    $response = $this->postJson(route('payment-methods.store'), [
        'provider_token_id' => 'tok_test_12345',
        'gateway' => 'fake',
    ]);

    $response->assertUnauthorized();
});

<?php

namespace Database\Factories\Payments;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<array<string, mixed>>
 */
class PaymentMethodFactory extends Factory
{
    /**
     * @var class-string<\App\Models\Payments\PaymentMethod>
     */
    protected $model = 'App\\Models\\Payments\\PaymentMethod';

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'user_id' => fn () => \App\Models\User::factory(),
            'provider' => fake()->randomElement(['fake', 'stripe', 'paypal']),
            'type' => 'card',
            'brand' => fake()->randomElement(['visa', 'mastercard', 'amex']),
            'label' => fake()->words(2, true),
            'last_four' => fake()->numerify('####'),
            'exp_month' => (string) fake()->numberBetween(1, 12),
            'exp_year' => (string) fake()->numberBetween(now()->year + 1, now()->year + 5),
            'is_default' => false,
            'status' => 'active',
            'fingerprint' => Str::random(32),
            'provider_account_id' => Str::uuid()->toString(),
            'provider_method_id' => Str::uuid()->toString(),
            'billing_address' => [
                'line1' => fake()->streetAddress(),
                'city' => fake()->city(),
                'country' => fake()->countryCode(),
                'postal_code' => fake()->postcode(),
            ],
            'metadata' => [
                'nickname' => fake()->word(),
            ],
            'expires_at' => now()->addYears(1),
            'last_used_at' => now(),
        ];
    }
}


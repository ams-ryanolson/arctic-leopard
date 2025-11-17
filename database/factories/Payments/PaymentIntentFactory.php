<?php

namespace Database\Factories\Payments;

use App\Enums\Payments\PaymentType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<array<string, mixed>>
 */
class PaymentIntentFactory extends Factory
{
    /**
     * @var class-string<\App\Models\Payments\PaymentIntent>
     */
    protected $model = 'App\\Models\\Payments\\PaymentIntent';

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $amount = fake()->numberBetween(500, 5000);

        return [
            'uuid' => (string) Str::uuid(),
            'payment_id' => null,
            'payable_type' => 'App\\Models\\Post',
            'payable_id' => fn () => \App\Models\Post::factory(),
            'payer_id' => fn () => \App\Models\User::factory(),
            'payee_id' => fn () => \App\Models\User::factory(),
            'amount' => $amount,
            'currency' => 'USD',
            'type' => PaymentType::OneTime->value,
            'method' => 'card',
            'status' => fake()->randomElement(['pending', 'requires_method', 'requires_confirmation', 'processing']),
            'provider' => fake()->randomElement(['fake', 'stripe']),
            'provider_intent_id' => Str::uuid()->toString(),
            'client_secret' => Str::random(32),
            'metadata' => [
                'purpose' => fake()->word(),
            ],
            'expires_at' => now()->addMinutes(30),
            'confirmed_at' => null,
            'cancelled_at' => null,
        ];
    }
}

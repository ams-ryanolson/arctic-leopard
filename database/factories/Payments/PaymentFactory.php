<?php

namespace Database\Factories\Payments;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<array<string, mixed>>
 */
class PaymentFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\App\Models\Payments\Payment>
     */
    protected $model = 'App\\Models\\Payments\\Payment';

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $amount = fake()->numberBetween(500, 25000);
        $fee = (int) round($amount * 0.1);

        return [
            'uuid' => (string) Str::uuid(),
            'payable_type' => 'App\\Models\\Post',
            'payable_id' => fn () => \App\Models\Post::factory(),
            'payer_id' => fn () => \App\Models\User::factory(),
            'payee_id' => fn () => \App\Models\User::factory(),
            'type' => fake()->randomElement(['one_time', 'recurring', 'adjustment']),
            'status' => fake()->randomElement(['pending', 'authorized', 'captured', 'settled']),
            'amount' => $amount,
            'fee_amount' => $fee,
            'net_amount' => $amount - $fee,
            'currency' => 'USD',
            'method' => fake()->randomElement(['card', 'wallet']),
            'provider' => fake()->randomElement(['fake', 'stripe', 'paypal']),
            'provider_payment_id' => Str::uuid()->toString(),
            'provider_customer_id' => Str::uuid()->toString(),
            'payment_method_id' => null,
            'metadata' => [
                'note' => fake()->sentence(),
            ],
            'authorized_at' => now(),
            'captured_at' => now(),
            'succeeded_at' => now(),
            'refunded_at' => null,
            'expires_at' => null,
        ];
    }
}


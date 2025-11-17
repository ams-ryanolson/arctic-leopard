<?php

namespace Database\Factories\Payments;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<array<string, mixed>>
 */
class PaymentRefundFactory extends Factory
{
    /**
     * @var class-string<\App\Models\Payments\PaymentRefund>
     */
    protected $model = 'App\\Models\\Payments\\PaymentRefund';

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $amount = fake()->numberBetween(100, 5000);

        return [
            'uuid' => (string) Str::uuid(),
            'payment_id' => fn () => \App\Models\Payments\Payment::factory(),
            'amount' => $amount,
            'currency' => 'USD',
            'status' => fake()->randomElement(['pending', 'processing', 'succeeded']),
            'reason' => fake()->sentence(),
            'provider' => 'fake',
            'provider_refund_id' => Str::uuid()->toString(),
            'metadata' => [
                'initiated_by' => fake()->randomElement(['system', 'user']),
            ],
            'processed_at' => now(),
        ];
    }
}

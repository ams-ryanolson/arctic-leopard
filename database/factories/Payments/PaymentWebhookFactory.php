<?php

namespace Database\Factories\Payments;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<array<string, mixed>>
 */
class PaymentWebhookFactory extends Factory
{
    /**
     * @var class-string<\App\Models\Payments\PaymentWebhook>
     */
    protected $model = 'App\\Models\\Payments\\PaymentWebhook';

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'provider' => fake()->randomElement(['fake', 'stripe', 'paypal']),
            'event' => fake()->randomElement(['payment.succeeded', 'payment.failed']),
            'signature' => Str::random(32),
            'headers' => [
                'X-Signature' => Str::random(32),
            ],
            'payload' => [
                'id' => Str::uuid()->toString(),
                'object' => 'event',
            ],
            'received_at' => now(),
            'processed_at' => null,
            'status' => 'pending',
            'exception' => null,
        ];
    }
}


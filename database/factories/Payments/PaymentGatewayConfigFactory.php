<?php

namespace Database\Factories\Payments;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<array<string, mixed>>
 */
class PaymentGatewayConfigFactory extends Factory
{
    /**
     * @var class-string<\App\Models\Payments\PaymentGatewayConfig>
     */
    protected $model = 'App\\Models\\Payments\\PaymentGatewayConfig';

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'configurable_type' => 'App\\Models\\User',
            'configurable_id' => fn () => \App\Models\User::factory(),
            'provider' => fake()->randomElement(['fake', 'stripe', 'paypal']),
            'is_default' => true,
            'status' => 'active',
            'settings' => [
                'api_key' => fake()->sha256(),
                'webhook_secret' => fake()->sha256(),
            ],
            'last_synced_at' => now(),
        ];
    }
}


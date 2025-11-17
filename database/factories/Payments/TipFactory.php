<?php

namespace Database\Factories\Payments;

use App\Enums\Payments\TipStatus;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<array<string, mixed>>
 */
class TipFactory extends Factory
{
    /**
     * @var class-string<\App\Models\Payments\Tip>
     */
    protected $model = 'App\\Models\\Payments\\Tip';

    public function definition(): array
    {
        $amount = fake()->numberBetween(200, 10000);

        return [
            'uuid' => (string) Str::uuid(),
            'payment_id' => null,
            'sender_id' => fn () => \App\Models\User::factory(),
            'recipient_id' => fn () => \App\Models\User::factory(),
            'amount' => $amount,
            'currency' => 'USD',
            'status' => TipStatus::Pending->value,
            'message' => fake()->sentence(),
            'metadata' => [
                'source' => 'factory',
            ],
        ];
    }
}

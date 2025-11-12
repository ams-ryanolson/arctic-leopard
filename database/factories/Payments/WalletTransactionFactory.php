<?php

namespace Database\Factories\Payments;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<array<string, mixed>>
 */
class WalletTransactionFactory extends Factory
{
    /**
     * @var class-string<\App\Models\Payments\WalletTransaction>
     */
    protected $model = 'App\\Models\\Payments\\WalletTransaction';

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $amount = fake()->numberBetween(100, 10000);
        $isCredit = fake()->boolean();

        return [
            'uuid' => (string) Str::uuid(),
            'user_id' => fn () => \App\Models\User::factory(),
            'type' => $isCredit ? 'credit' : 'debit',
            'amount' => $amount,
            'currency' => 'USD',
            'balance_after' => $isCredit ? $amount : -$amount,
            'source_type' => 'App\\Models\\Payments\\Payment',
            'source_id' => fn () => \App\Models\Payments\Payment::factory(),
            'payment_id' => fn () => \App\Models\Payments\Payment::factory(),
            'description' => fake()->sentence(),
            'metadata' => [
                'batch' => Str::random(8),
            ],
            'occurred_at' => now(),
        ];
    }
}


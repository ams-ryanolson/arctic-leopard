<?php

namespace Database\Factories\Payments;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<array<string, mixed>>
 */
class LedgerEntryFactory extends Factory
{
    /**
     * @var class-string<\App\Models\Payments\LedgerEntry>
     */
    protected $model = 'App\\Models\\Payments\\LedgerEntry';

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $amount = fake()->numberBetween(100, 5000);
        $direction = fake()->randomElement(['debit', 'credit']);

        return [
            'uuid' => (string) Str::uuid(),
            'ledger' => 'general',
            'ledgerable_type' => 'App\\Models\\User',
            'ledgerable_id' => fn () => \App\Models\User::factory(),
            'payment_id' => fn () => \App\Models\Payments\Payment::factory(),
            'direction' => $direction,
            'amount' => $amount,
            'currency' => 'USD',
            'balance_after' => $direction === 'credit' ? $amount : -$amount,
            'occurred_at' => now(),
            'metadata' => [
                'notes' => fake()->sentence(),
            ],
        ];
    }
}


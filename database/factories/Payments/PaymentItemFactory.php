<?php

namespace Database\Factories\Payments;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<array<string, mixed>>
 */
class PaymentItemFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\App\Models\Payments\PaymentItem>
     */
    protected $model = 'App\\Models\\Payments\\PaymentItem';

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $amount = fake()->numberBetween(100, 5000);

        return [
            'payment_id' => fn () => \App\Models\Payments\Payment::factory(),
            'payable_type' => 'App\\Models\\Post',
            'payable_id' => fn () => \App\Models\Post::factory(),
            'description' => fake()->sentence(),
            'amount' => $amount,
            'quantity' => 1,
            'metadata' => [
                'reference' => Str::uuid()->toString(),
            ],
        ];
    }
}


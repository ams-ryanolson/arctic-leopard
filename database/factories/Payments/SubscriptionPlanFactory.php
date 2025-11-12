<?php

namespace Database\Factories\Payments;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<array<string, mixed>>
 */
class SubscriptionPlanFactory extends Factory
{
    /**
     * @var class-string<\App\Models\Payments\SubscriptionPlan>
     */
    protected $model = 'App\\Models\\Payments\\SubscriptionPlan';

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'uuid' => (string) Str::uuid(),
            'creator_id' => fn () => \App\Models\User::factory(),
            'name' => $name,
            'slug' => Str::slug($name) . '-' . fake()->unique()->numerify('###'),
            'description' => fake()->sentence(),
            'amount' => fake()->numberBetween(500, 5000),
            'currency' => 'USD',
            'interval' => fake()->randomElement(['monthly', 'quarterly', 'yearly']),
            'interval_count' => 1,
            'trial_days' => fake()->randomElement([0, 7, 14]),
            'is_active' => true,
            'is_public' => true,
            'metadata' => [
                'label' => fake()->word(),
            ],
        ];
    }
}


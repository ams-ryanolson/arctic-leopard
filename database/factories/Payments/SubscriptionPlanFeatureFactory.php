<?php

namespace Database\Factories\Payments;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<array<string, mixed>>
 */
class SubscriptionPlanFeatureFactory extends Factory
{
    /**
     * @var class-string<\App\Models\Payments\SubscriptionPlanFeature>
     */
    protected $model = 'App\\Models\\Payments\\SubscriptionPlanFeature';

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'subscription_plan_id' => fn () => \App\Models\Payments\SubscriptionPlan::factory(),
            'name' => fake()->sentence(3),
            'value' => (string) fake()->numberBetween(1, 10),
            'description' => fake()->sentence(),
            'display_order' => fake()->numberBetween(0, 10),
        ];
    }
}

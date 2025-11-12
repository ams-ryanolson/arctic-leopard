<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\PostPurchase>
 */
class PostPurchaseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'uuid' => $this->faker->uuid(),
            'post_id' => Post::factory(),
            'user_id' => User::factory(),
            'payment_id' => null,
            'amount' => $this->faker->numberBetween(500, 5000),
            'currency' => 'USD',
            'status' => \App\Enums\Payments\PostPurchaseStatus::Completed->value,
            'expires_at' => null,
            'fulfilled_at' => now(),
            'metadata' => [],
        ];
    }
}

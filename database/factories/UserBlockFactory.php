<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\UserBlock>
 */
class UserBlockFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'blocker_id' => User::factory(),
            'blocked_id' => User::factory(),
            'reason' => $this->faker->randomElement(['spam', 'harassment', 'privacy']),
            'notes' => $this->faker->boolean(30) ? $this->faker->sentence() : null,
            'expires_at' => null,
            'meta' => [],
        ];
    }
}

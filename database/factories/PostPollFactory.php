<?php

namespace Database\Factories;

use App\Models\Post;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\PostPoll>
 */
class PostPollFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $allowMultiple = $this->faker->boolean(25);

        return [
            'post_id' => Post::factory(),
            'question' => $this->faker->sentence(),
            'allow_multiple' => $allowMultiple,
            'max_choices' => $allowMultiple ? $this->faker->numberBetween(2, 4) : null,
            'closes_at' => $this->faker->boolean(50) ? now()->addDays($this->faker->numberBetween(1, 7)) : null,
            'meta' => [],
        ];
    }
}

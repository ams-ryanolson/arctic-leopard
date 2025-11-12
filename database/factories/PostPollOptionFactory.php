<?php

namespace Database\Factories;

use App\Models\PostPoll;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\PostPollOption>
 */
class PostPollOptionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'post_poll_id' => PostPoll::factory(),
            'title' => $this->faker->words(3, true),
            'position' => 0,
            'vote_count' => 0,
            'meta' => [],
        ];
    }
}

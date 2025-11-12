<?php

namespace Database\Factories;

use App\Models\PostPollOption;
use App\Models\PostPollVote;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\PostPollVote>
 */
class PostPollVoteFactory extends Factory
{
    /**
     * Configure the factory.
     *
     * @return $this
     */
    public function configure(): static
    {
        return $this->afterCreating(function (PostPollVote $vote): void {
            if ($vote->post_poll_id === null) {
                $option = $vote->option;

                if ($option !== null) {
                    $vote->post_poll_id = $option->post_poll_id;
                    $vote->save();
                }
            }
        });
    }

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'post_poll_id' => null,
            'post_poll_option_id' => PostPollOption::factory(),
            'user_id' => User::factory(),
            'ip_address' => $this->faker->ipv4(),
            'meta' => [],
        ];
    }
}

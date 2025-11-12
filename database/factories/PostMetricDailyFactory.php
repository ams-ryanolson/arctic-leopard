<?php

namespace Database\Factories;

use App\Models\Post;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\PostMetricDaily>
 */
class PostMetricDailyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $countryCodes = collect(['US', 'CA', 'GB', 'DE', 'BR', 'AU']);

        $countries = $countryCodes
            ->random(rand(1, 3))
            ->mapWithKeys(static fn (string $code) => [$code => rand(1, 50)])
            ->all();

        return [
            'post_id' => Post::factory(),
            'date' => $this->faker->date(),
            'likes' => $this->faker->numberBetween(0, 500),
            'comments' => $this->faker->numberBetween(0, 200),
            'reposts' => $this->faker->numberBetween(0, 150),
            'poll_votes' => $this->faker->numberBetween(0, 100),
            'views' => $this->faker->numberBetween(0, 5000),
            'purchases' => $this->faker->numberBetween(0, 50),
            'unique_viewers' => $this->faker->numberBetween(0, 2500),
            'unique_authenticated_viewers' => $this->faker->numberBetween(0, 1500),
            'unique_guest_viewers' => $this->faker->numberBetween(0, 1000),
            'country_breakdown' => $countries,
        ];
    }
}

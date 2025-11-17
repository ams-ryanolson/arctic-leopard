<?php

namespace Database\Factories;

use App\Enums\StoryAudience;
use App\Models\Story;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Story>
 */
class StoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $publishedAt = Carbon::instance($this->faker->dateTimeBetween('-23 hours', 'now'));

        return [
            'user_id' => User::factory(),
            'position' => 0,
            'audience' => Arr::random(StoryAudience::values()),
            'is_subscriber_only' => $this->faker->boolean(20),
            'scheduled_at' => null,
            'published_at' => $publishedAt,
            'expires_at' => $publishedAt->copy()->addHours(24),
            'views_count' => 0,
            'reactions_count' => 0,
        ];
    }

    /**
     * Indicate that the story is scheduled.
     *
     * @return $this
     */
    public function scheduled(): static
    {
        return $this->state(function (array $attributes) {
            $scheduledAt = Carbon::instance($this->faker->dateTimeBetween('now', '+7 days'));

            return [
                'scheduled_at' => $scheduledAt,
                'published_at' => null,
                'expires_at' => null,
            ];
        });
    }

    /**
     * Indicate that the story is published.
     *
     * @return $this
     */
    public function published(): static
    {
        return $this->state(function (array $attributes) {
            $publishedAt = Carbon::instance($this->faker->dateTimeBetween('-23 hours', 'now'));

            return [
                'published_at' => $publishedAt,
                'expires_at' => $publishedAt->copy()->addHours(24),
                'scheduled_at' => null,
            ];
        });
    }

    /**
     * Indicate that the story is expired.
     *
     * @return $this
     */
    public function expired(): static
    {
        return $this->state(function (array $attributes) {
            $publishedAt = Carbon::instance($this->faker->dateTimeBetween('-48 hours', '-25 hours'));

            return [
                'published_at' => $publishedAt,
                'expires_at' => $publishedAt->copy()->addHours(24),
            ];
        });
    }

    /**
     * Indicate that the story is subscriber-only.
     *
     * @return $this
     */
    public function subscriberOnly(): static
    {
        return $this->state(fn () => [
            'is_subscriber_only' => true,
        ]);
    }

    /**
     * Indicate that the story has a specific audience.
     *
     * @return $this
     */
    public function audience(StoryAudience $audience): static
    {
        return $this->state(fn () => [
            'audience' => $audience->value,
        ]);
    }
}

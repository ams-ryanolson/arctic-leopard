<?php

namespace Database\Factories;

use App\Enums\TimelineVisibilitySource;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Arr;

/**
 * @extends Factory<\App\Models\Timeline>
 */
class TimelineFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'post_id' => Post::factory(),
            'visibility_source' => Arr::random(TimelineVisibilitySource::values()),
            'context' => [],
            'visible_at' => now(),
        ];
    }
}

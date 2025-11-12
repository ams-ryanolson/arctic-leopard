<?php

namespace Database\Factories;

use App\Models\Post;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<\App\Models\PostViewEvent>
 */
class PostViewEventFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'post_id' => Post::factory(),
            'viewer_id' => null,
            'session_uuid' => (string) Str::uuid(),
            'fingerprint_hash' => Str::random(64),
            'ip_hash' => Str::random(64),
            'user_agent_hash' => Str::random(64),
            'country_code' => $this->faker->countryCode(),
            'context' => [
                'source' => $this->faker->randomElement(['feed', 'profile', 'permalink']),
            ],
            'occurred_at' => $this->faker->dateTimeBetween('-1 day'),
        ];
    }
}


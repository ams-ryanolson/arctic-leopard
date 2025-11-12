<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Comment>
 */
class CommentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'post_id' => Post::factory(),
            'user_id' => User::factory(),
            'parent_id' => null,
            'depth' => 0,
            'is_pinned' => false,
            'body' => $this->faker->sentences(2, true),
            'likes_count' => 0,
            'replies_count' => 0,
            'edited_at' => null,
            'extra_attributes' => [],
        ];
    }
}

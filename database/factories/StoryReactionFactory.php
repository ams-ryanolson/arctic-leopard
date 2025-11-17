<?php

namespace Database\Factories;

use App\Models\Story;
use App\Models\StoryReaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StoryReaction>
 */
class StoryReactionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $allowedReactions = config('stories.allowed_reactions', ['❤️', '🔥', '👍', '😍', '😮']);

        return [
            'story_id' => Story::factory(),
            'user_id' => User::factory(),
            'emoji' => $this->faker->randomElement($allowedReactions),
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\Story;
use App\Models\StoryView;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<StoryView>
 */
class StoryViewFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'story_id' => Story::factory(),
            'user_id' => User::factory(),
            'viewed_at' => Carbon::now(),
        ];
    }
}

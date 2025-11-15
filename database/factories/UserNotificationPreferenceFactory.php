<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserNotificationPreference>
 */
class UserNotificationPreferenceFactory extends Factory
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
            'follows' => true,
            'follow_requests' => true,
            'follow_approvals' => true,
            'post_likes' => true,
            'post_bookmarks' => true,
            'messages' => true,
            'comments' => true,
            'replies' => true,
        ];
    }
}

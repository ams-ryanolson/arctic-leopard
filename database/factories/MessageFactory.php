<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @extends Factory<\App\Models\Message>
 */
class MessageFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'ulid' => (string) Str::ulid(),
            'conversation_id' => Conversation::factory(),
            'user_id' => User::factory(),
            'reply_to_id' => null,
            'deleted_by_id' => null,
            'type' => 'message',
            'sequence' => $this->faker->numberBetween(1, 100_000),
            'body' => $this->faker->sentences(2, true),
            'fragments' => [],
            'metadata' => [],
            'visible_at' => Carbon::now(),
            'edited_at' => null,
            'redacted_at' => null,
            'undo_expires_at' => Carbon::now()->addMinutes(5),
        ];
    }

    public function system(): static
    {
        return $this->state(fn () => [
            'type' => 'system',
            'user_id' => null,
        ]);
    }

    public function deleted(): static
    {
        return $this->state(fn () => [
            'deleted_at' => Carbon::now(),
            'deleted_by_id' => User::factory(),
        ]);
    }
}

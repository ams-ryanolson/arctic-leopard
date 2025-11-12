<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<\App\Models\ConversationParticipant>
 */
class ConversationParticipantFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'conversation_id' => Conversation::factory(),
            'user_id' => User::factory(),
            'role' => $this->faker->randomElement(['member', 'moderator']),
            'is_pinned' => false,
            'is_favorite' => false,
            'last_read_message_id' => null,
            'last_read_at' => null,
            'joined_at' => Carbon::now(),
            'left_at' => null,
            'muted_until' => null,
            'settings' => [],
            'metadata' => [],
        ];
    }

    public function owner(): static
    {
        return $this->state(fn (): array => [
            'role' => 'owner',
        ]);
    }

    public function mutedUntil(Carbon|string $until): static
    {
        $timestamp = $until instanceof Carbon ? $until : Carbon::parse($until);

        return $this->state(
            fn () => [
                'muted_until' => $timestamp,
            ],
        );
    }
}

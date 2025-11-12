<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<\App\Models\Conversation>
 */
class ConversationFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = $this->faker->randomElement(['direct', 'group']);

        return [
            'ulid' => (string) Str::ulid(),
            'type' => $type,
            'subject' => $type === 'group' ? $this->faker->sentence(3) : null,
            'creator_id' => User::factory(),
            'participant_count' => 0,
            'message_count' => 0,
            'last_message_at' => null,
            'archived_at' => null,
            'muted_until' => null,
            'settings' => [],
            'metadata' => [],
        ];
    }

    public function direct(): static
    {
        return $this->state(fn (): array => [
            'type' => 'direct',
            'subject' => null,
        ]);
    }

    public function group(): static
    {
        return $this->state(fn (): array => [
            'type' => 'group',
            'subject' => $this->faker->sentence(3),
        ]);
    }

    public function system(): static
    {
        return $this->state(fn (): array => [
            'type' => 'system',
            'creator_id' => null,
        ]);
    }
}

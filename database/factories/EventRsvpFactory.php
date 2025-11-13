<?php

namespace Database\Factories;

use App\Enums\EventRsvpStatus;
use App\Models\Event;
use App\Models\EventRsvp;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<EventRsvp>
 */
class EventRsvpFactory extends Factory
{
    protected $model = EventRsvp::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = Arr::random(EventRsvpStatus::values());

        return [
            'event_id' => Event::factory(),
            'user_id' => User::factory(),
            'status' => $status,
            'guest_count' => $this->faker->boolean(20) ? $this->faker->numberBetween(1, 3) : 0,
            'responded_at' => Carbon::instance($this->faker->dateTimeBetween('-7 days', 'now')),
            'note' => $this->faker->optional()->sentence(),
        ];
    }

    /**
     * Indicate a specific RSVP status.
     *
     * @return $this
     */
    public function status(EventRsvpStatus $status): static
    {
        return $this->state(fn () => ['status' => $status->value]);
    }

    /**
     * Indicate this RSVP has been cancelled.
     *
     * @return $this
     */
    public function cancelled(): static
    {
        return $this->status(EventRsvpStatus::Cancelled);
    }
}

<?php

namespace Database\Factories;

use App\Enums\EventModality;
use App\Enums\EventStatus;
use App\Enums\EventType;
use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    protected $model = Event::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = $this->faker->unique()->sentence(4);
        $startsAt = Carbon::instance($this->faker->dateTimeBetween('+3 days', '+3 months'));
        $endsAt = (clone $startsAt)->addHours($this->faker->numberBetween(2, 8));
        $modality = Arr::random(EventModality::values());
        $type = Arr::random(EventType::values());

        $locationCity = $modality === EventModality::Virtual->value
            ? null
            : $this->faker->city();

        return [
            'series_id' => null,
            'parent_event_id' => null,
            'created_by_id' => User::factory(),
            'submitted_by_id' => null,
            'manager_id' => null,
            'approved_by_id' => null,
            'status' => EventStatus::Published->value,
            'modality' => $modality,
            'type' => $type,
            'is_recurring' => false,
            'recurrence_rule' => null,
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::random(6),
            'subtitle' => $this->faker->optional()->catchPhrase(),
            'avatar_path' => null,
            'cover_path' => null,
            'description' => $this->faker->paragraphs(3, true),
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'timezone' => $this->faker->timezone(),
            'rsvp_limit' => $this->faker->boolean(30) ? $this->faker->numberBetween(25, 250) : null,
            'allow_guests' => $this->faker->boolean(),
            'location_name' => $locationCity ? sprintf('%s %s', $this->faker->company(), $this->faker->randomElement(['Hall', 'Studio', 'Center'])) : null,
            'location_venue' => $locationCity ? $this->faker->streetName() : null,
            'location_address' => $locationCity ? $this->faker->streetAddress() : null,
            'location_city' => $locationCity,
            'location_region' => $locationCity ? $this->faker->state() : null,
            'location_postal_code' => $locationCity ? $this->faker->postcode() : null,
            'location_country' => $locationCity ? Str::upper($this->faker->countryCode()) : null,
            'location_latitude' => $locationCity ? $this->faker->latitude() : null,
            'location_longitude' => $locationCity ? $this->faker->longitude() : null,
            'virtual_meeting_url' => $modality !== EventModality::InPerson->value ? $this->faker->url() : null,
            'requirements' => [
                'age' => $this->faker->boolean(40) ? '21+' : null,
                'dress_code' => $this->faker->boolean(30) ? 'Leather, fetish gear encouraged.' : null,
            ],
            'extra_attributes' => null,
            'submitted_at' => null,
            'approved_at' => null,
            'published_at' => $startsAt->copy()->subWeeks(2),
            'cancelled_at' => null,
            'submission_notes' => null,
            'admin_notes' => null,
        ];
    }

    /**
     * Indicate that the event is pending approval.
     *
     * @return $this
     */
    public function pending(?User $submitter = null): static
    {
        return $this->state(fn () => [
            'status' => EventStatus::Pending->value,
            'submitted_by_id' => $submitter?->getKey() ?? User::factory(),
            'submitted_at' => Carbon::now(),
            'published_at' => null,
        ]);
    }

    /**
     * Indicate that the event is virtual.
     *
     * @return $this
     */
    public function virtual(): static
    {
        return $this->modality(EventModality::Virtual);
    }

    /**
     * Set a specific modality.
     *
     * @return $this
     */
    public function modality(EventModality $modality): static
    {
        $locationName = $modality === EventModality::InPerson
            ? $this->faker->company()
            : null;

        $locationCity = $modality === EventModality::InPerson
            ? $this->faker->city()
            : null;

        $locationRegion = $locationCity ? $this->faker->state() : null;
        $locationPostal = $locationCity ? $this->faker->postcode() : null;
        $locationCountry = $locationCity ? Str::upper($this->faker->countryCode()) : null;
        $locationLatitude = $locationCity ? $this->faker->latitude() : null;
        $locationLongitude = $locationCity ? $this->faker->longitude() : null;
        $virtualUrl = $modality !== EventModality::InPerson ? $this->faker->url() : null;

        $state = [
            'modality' => $modality->value,
            'virtual_meeting_url' => $virtualUrl,
        ];

        if ($modality === EventModality::InPerson) {
            $state = array_merge($state, [
                'location_name' => $locationName,
                'location_city' => $locationCity,
                'location_region' => $locationRegion,
                'location_postal_code' => $locationPostal,
                'location_country' => $locationCountry,
                'location_latitude' => $locationLatitude,
            ]);
        } else {
            $state = array_merge($state, [
                'location_name' => null,
                'location_venue' => null,
                'location_address' => null,
                'location_city' => null,
                'location_region' => null,
                'location_postal_code' => null,
                'location_country' => null,
                'location_latitude' => null,
                'location_longitude' => null,
            ]);
        }

        if ($modality === EventModality::InPerson) {
            $state['location_longitude'] = $locationLongitude;
        }

        return $this->state(fn () => $state);
    }

    /**
     * Set a specific event type.
     *
     * @return $this
     */
    public function type(EventType $type): static
    {
        return $this->state(fn () => ['type' => $type->value]);
    }

    /**
     * Indicate the event should have a recurring series identifier.
     *
     * @return $this
     */
    public function recurring(?string $rule = 'RRULE:FREQ=WEEKLY;COUNT=4'): static
    {
        return $this->state(function () use ($rule) {
            return [
                'is_recurring' => true,
                'recurrence_rule' => $rule,
                'series_id' => (string) Str::uuid(),
            ];
        });
    }
}

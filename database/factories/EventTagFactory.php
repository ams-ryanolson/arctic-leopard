<?php

namespace Database\Factories;

use App\Models\EventTag;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<EventTag>
 */
class EventTagFactory extends Factory
{
    protected $model = EventTag::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = ucfirst($this->faker->unique()->words(asText: true));

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::random(4),
            'color' => $this->faker->hexColor(),
            'icon' => $this->faker->randomElement(['heroicons-fire', 'heroicons-beaker', 'heroicons-sparkles', null]),
            'description' => $this->faker->optional()->sentence(),
            'is_active' => true,
            'display_order' => $this->faker->numberBetween(0, 50),
        ];
    }

    /**
     * Indicate that the tag is inactive.
     *
     * @return $this
     */
    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}

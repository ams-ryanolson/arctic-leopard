<?php

namespace Database\Factories;

use App\Models\Circle;
use App\Models\Interest;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Circle>
 */
class CircleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = $this->faker->unique()->words(3, true);

        return [
            'interest_id' => Interest::factory(),
            'name' => Str::title($name),
            'slug' => Str::slug($name.'-'.$this->faker->unique()->numberBetween(100, 999)),
            'tagline' => $this->faker->optional()->sentence(),
            'description' => $this->faker->optional()->paragraph(),
            'facet_filters' => null,
            'metadata' => null,
            'visibility' => 'public',
            'is_featured' => false,
            'sort_order' => $this->faker->numberBetween(1, 500),
        ];
    }
}

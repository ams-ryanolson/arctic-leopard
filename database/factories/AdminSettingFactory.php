<?php

namespace Database\Factories;

use App\Models\AdminSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AdminSetting>
 */
class AdminSettingFactory extends Factory
{
    protected $model = AdminSetting::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'key' => fake()->unique()->word(),
            'value' => fake()->word(),
            'description' => fake()->sentence(),
            'type' => 'string',
            'category' => 'general',
        ];
    }

    /**
     * Indicate that the setting is an integer type.
     */
    public function integer(): static
    {
        return $this->state(fn (array $attributes): array => [
            'type' => 'integer',
            'value' => (string) fake()->numberBetween(1, 100),
        ]);
    }

    /**
     * Indicate that the setting is a boolean type.
     */
    public function boolean(): static
    {
        return $this->state(fn (array $attributes): array => [
            'type' => 'boolean',
            'value' => fake()->boolean() ? '1' : '0',
        ]);
    }

    /**
     * Indicate that the setting is in the verification category.
     */
    public function verification(): static
    {
        return $this->state(fn (array $attributes): array => [
            'category' => 'verification',
        ]);
    }
}

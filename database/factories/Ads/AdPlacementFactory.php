<?php

namespace Database\Factories\Ads;

use App\Enums\Ads\AdSize;
use App\Models\Ads\AdPlacement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AdPlacement>
 */
class AdPlacementFactory extends Factory
{
    protected $model = AdPlacement::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'key' => $this->faker->unique()->slug(),
            'name' => $this->faker->words(3, true),
            'description' => $this->faker->optional()->sentence(),
            'allowed_sizes' => [AdSize::Small->value, AdSize::Medium->value],
            'default_weight' => 100,
            'is_active' => true,
            'metadata' => null,
        ];
    }
}

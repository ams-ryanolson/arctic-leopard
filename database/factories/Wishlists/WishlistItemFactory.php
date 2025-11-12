<?php

namespace Database\Factories\Wishlists;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<array<string, mixed>>
 */
class WishlistItemFactory extends Factory
{
    /**
     * @var class-string<\App\Models\Wishlists\WishlistItem>
     */
    protected $model = 'App\\Models\\Wishlists\\WishlistItem';

    public function definition(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'creator_id' => fn () => \App\Models\User::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'amount' => fake()->numberBetween(2000, 50000),
            'currency' => 'USD',
            'url' => fake()->url(),
            'image_url' => fake()->imageUrl(),
            'is_active' => true,
            'metadata' => [
                'category' => fake()->word(),
            ],
        ];
    }
}


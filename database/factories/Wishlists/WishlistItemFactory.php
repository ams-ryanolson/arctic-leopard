<?php

namespace Database\Factories\Wishlists;

use App\Enums\WishlistItemStatus;
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
        $isCrowdfunded = fake()->boolean(30);

        return [
            'uuid' => (string) Str::uuid(),
            'creator_id' => fn () => \App\Models\User::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'amount' => fake()->numberBetween(2000, 50000),
            'currency' => 'USD',
            'url' => fake()->url(),
            'image_url' => fake()->imageUrl(),
            'quantity' => $isCrowdfunded ? null : fake()->numberBetween(1, 10),
            'is_crowdfunded' => $isCrowdfunded,
            'goal_amount' => $isCrowdfunded ? fake()->numberBetween(10000, 100000) : null,
            'current_funding' => $isCrowdfunded ? fake()->numberBetween(0, 50000) : 0,
            'status' => WishlistItemStatus::Active,
            'expires_at' => fake()->boolean(20) ? fake()->dateTimeBetween('+1 week', '+1 month') : null,
            'approved_at' => now(),
            'is_active' => true,
            'metadata' => [
                'category' => fake()->word(),
            ],
        ];
    }

    public function crowdfunded(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_crowdfunded' => true,
            'quantity' => null,
            'goal_amount' => fake()->numberBetween(10000, 100000),
            'current_funding' => fake()->numberBetween(0, 50000),
        ]);
    }

    public function fixedPrice(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_crowdfunded' => false,
            'quantity' => fake()->numberBetween(1, 10),
            'goal_amount' => null,
            'current_funding' => 0,
        ]);
    }

    public function fulfilled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => WishlistItemStatus::Fulfilled,
            'deleted_at' => now(),
        ]);
    }

    public function funded(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => WishlistItemStatus::Funded,
            'current_funding' => $attributes['goal_amount'] ?? 100000,
        ]);
    }

    public function pendingApproval(): static
    {
        return $this->state(fn (array $attributes) => [
            'approved_at' => null,
        ]);
    }
}

<?php

namespace Database\Factories\Wishlists;

use App\Enums\Payments\WishlistPurchaseStatus;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<array<string, mixed>>
 */
class WishlistPurchaseFactory extends Factory
{
    /**
     * @var class-string<\App\Models\Wishlists\WishlistPurchase>
     */
    protected $model = 'App\\Models\\Wishlists\\WishlistPurchase';

    public function definition(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'wishlist_item_id' => fn () => \App\Models\Wishlists\WishlistItem::factory(),
            'buyer_id' => fn () => \App\Models\User::factory(),
            'payment_id' => null,
            'amount' => fake()->numberBetween(500, 50000), // Minimum $5.00
            'currency' => 'USD',
            'status' => WishlistPurchaseStatus::Pending->value,
            'message' => fake()->optional()->sentence(),
            'covers_fee' => fake()->boolean(30),
            'metadata' => [
                'source' => 'factory',
            ],
            'fulfilled_at' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => WishlistPurchaseStatus::Completed->value,
            'fulfilled_at' => now(),
        ]);
    }

    public function withFee(): static
    {
        return $this->state(fn (array $attributes) => [
            'covers_fee' => true,
        ]);
    }
}

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
            'amount' => fake()->numberBetween(2000, 50000),
            'currency' => 'USD',
            'status' => WishlistPurchaseStatus::Pending->value,
            'message' => fake()->sentence(),
            'metadata' => [
                'source' => 'factory',
            ],
            'fulfilled_at' => null,
        ];
    }
}


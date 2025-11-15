<?php

namespace Database\Factories\Memberships;

use App\Models\Memberships\MembershipDiscount;
use App\Models\Memberships\MembershipPlan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MembershipDiscount>
 */
class MembershipDiscountFactory extends Factory
{
    protected $model = MembershipDiscount::class;

    public function definition(): array
    {
        return [
            'membership_plan_id' => null, // null = applies to all
            'code' => strtoupper(fake()->bothify('????-####')),
            'description' => fake()->sentence(),
            'discount_type' => 'percentage',
            'discount_value' => fake()->numberBetween(10, 50), // 10-50%
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
            'max_uses' => null,
            'used_count' => 0,
            'is_active' => true,
        ];
    }

    public function fixedAmount(int $amount): static
    {
        return $this->state(fn (array $attributes) => [
            'discount_type' => 'fixed_amount',
            'discount_value' => $amount,
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
            'ends_at' => now()->subDay(),
        ]);
    }

    public function forPlan(MembershipPlan $plan): static
    {
        return $this->state(fn (array $attributes) => [
            'membership_plan_id' => $plan->id,
        ]);
    }
}

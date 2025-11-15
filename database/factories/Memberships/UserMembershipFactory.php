<?php

namespace Database\Factories\Memberships;

use App\Models\Memberships\MembershipPlan;
use App\Models\Memberships\UserMembership;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UserMembership>
 */
class UserMembershipFactory extends Factory
{
    protected $model = UserMembership::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'membership_plan_id' => MembershipPlan::factory(),
            'status' => 'active',
            'billing_type' => 'recurring',
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
            'next_billing_at' => now()->addMonth(),
            'cancelled_at' => null,
            'cancellation_reason' => null,
            'payment_id' => null,
            'original_price' => 1000,
            'discount_amount' => 0,
        ];
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'expired',
            'ends_at' => now()->subDay(),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => 'user_requested',
        ]);
    }

    public function oneTime(): static
    {
        return $this->state(fn (array $attributes) => [
            'billing_type' => 'one_time',
            'next_billing_at' => null,
        ]);
    }
}

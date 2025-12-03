<?php

namespace Database\Factories\Memberships;

use App\Models\Memberships\MembershipPlan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<MembershipPlan>
 */
class MembershipPlanFactory extends Factory
{
    protected $model = MembershipPlan::class;

    public function definition(): array
    {
        // Plan names can be anything, but role_to_assign must match actual seeded roles
        $planNames = ['Bronze Plan', 'Silver Plan', 'Gold Plan', 'Basic Plan', 'Pro Plan'];
        $roleNames = ['Bronze', 'Silver', 'Gold', 'Bronze', 'Gold']; // Map plan names to actual roles
        $index = array_rand($planNames);
        $name = $planNames[$index];
        $role = $roleNames[$index];

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'monthly_price' => fake()->numberBetween(1000, 5000), // $10-$50
            'yearly_price' => fake()->numberBetween(10000, 50000), // $100-$500
            'currency' => 'USD',
            'role_to_assign' => $role,
            'permissions_to_grant' => null,
            'features' => [
                'feature_1' => fake()->sentence(),
                'feature_2' => fake()->sentence(),
            ],
            'is_active' => true,
            'is_public' => true,
            'display_order' => 0,
            'allows_recurring' => true,
            'allows_one_time' => true,
            'one_time_duration_days' => 30,
        ];
    }
}

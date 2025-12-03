<?php

namespace Database\Seeders;

use App\Models\Memberships\MembershipPlan;
use Illuminate\Database\Seeder;

class MembershipPlansSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Bronze',
                'slug' => 'bronze',
                'description' => 'Bronze membership tier with access to premium features.',
                'monthly_price' => 1000, // $10.00 in cents
                'yearly_price' => 10000, // $100.00 in cents
                'currency' => 'USD',
                'role_to_assign' => 'Bronze',
                'permissions_to_grant' => null,
                'features' => [],
                'is_active' => true,
                'is_public' => true,
                'display_order' => 1,
                'allows_recurring' => true,
                'allows_one_time' => true,
                'one_time_duration_days' => 30,
            ],
            [
                'name' => 'Silver',
                'slug' => 'silver',
                'description' => 'Silver membership tier with enhanced features.',
                'monthly_price' => 1500, // $15.00 in cents
                'yearly_price' => 15000, // $150.00 in cents
                'currency' => 'USD',
                'role_to_assign' => 'Silver',
                'permissions_to_grant' => null,
                'features' => [],
                'is_active' => true,
                'is_public' => true,
                'display_order' => 2,
                'allows_recurring' => true,
                'allows_one_time' => true,
                'one_time_duration_days' => 30,
            ],
            [
                'name' => 'Gold',
                'slug' => 'gold',
                'description' => 'Gold membership tier with lifetime access and premium features.',
                'monthly_price' => 2500, // $25.00 in cents
                'yearly_price' => 25000, // $250.00 in cents
                'currency' => 'USD',
                'role_to_assign' => 'Gold',
                'permissions_to_grant' => null,
                'features' => [],
                'is_active' => true,
                'is_public' => true,
                'display_order' => 3,
                'allows_recurring' => false,
                'allows_one_time' => true,
                'one_time_duration_days' => null, // Lifetime - no expiry
            ],
        ];

        foreach ($plans as $planData) {
            MembershipPlan::query()->firstOrCreate(
                ['slug' => $planData['slug']],
                $planData
            );
        }
    }
}

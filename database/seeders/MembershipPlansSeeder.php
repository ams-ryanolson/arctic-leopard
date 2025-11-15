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
                'name' => 'Premium',
                'slug' => 'premium',
                'description' => 'Boost your feed with exclusive drops and scene recaps. Perfect for members who want full-resolution galleries, story unlocks, and weekly studio updates.',
                'monthly_price' => 1000, // $10.00 in cents
                'yearly_price' => 10000, // $100.00 in cents (10x monthly, 2 months free)
                'currency' => 'USD',
                'role_to_assign' => 'Premium',
                'permissions_to_grant' => null,
                'features' => [
                    'premium_content_drops' => '3 premium content drops every week',
                    'event_replays' => 'Priority access to live event replays',
                    'backstage_polls' => 'Unlocks backstage polls & feedback loops',
                    'invite_only_chat' => 'Invite-only chat threads with creators',
                ],
                'is_active' => true,
                'is_public' => true,
                'display_order' => 1,
                'allows_recurring' => true,
                'allows_one_time' => true,
                'one_time_duration_days' => 30,
            ],
            [
                'name' => 'Elite',
                'slug' => 'elite',
                'description' => 'Edge deeper with live intensives, vault archives, and crew access. Go beyond standard drops with advanced workshops, circle rooms, and hands-on mentorship touchpoints.',
                'monthly_price' => 2000, // $20.00 in cents
                'yearly_price' => 20000, // $200.00 in cents (10x monthly, 2 months free)
                'currency' => 'USD',
                'role_to_assign' => 'Elite',
                'permissions_to_grant' => null,
                'features' => [
                    'unlimited_archive' => 'Unlimited archive + premium vault unlocks',
                    'live_intensives' => 'Monthly live intensives with Q&A',
                    'circle_rooms' => 'Circle-only rooms & ritual planning boards',
                    'merch_drops' => 'Quarterly merch & kink kit drops',
                ],
                'is_active' => true,
                'is_public' => true,
                'display_order' => 2,
                'allows_recurring' => true,
                'allows_one_time' => true,
                'one_time_duration_days' => 30,
            ],
            [
                'name' => 'Unlimited',
                'slug' => 'unlimited',
                'description' => 'Total access, concierge scheduling, and IRL priority lanes. Designed for producers, collectors, and power supporters who want concierge access, travel support, and direct collaboration.',
                'monthly_price' => 3000, // $30.00 in cents
                'yearly_price' => 30000, // $300.00 in cents (10x monthly, 2 months free)
                'currency' => 'USD',
                'role_to_assign' => 'Unlimited',
                'permissions_to_grant' => null,
                'features' => [
                    'concierge' => 'Dedicated concierge with 24-hour response window',
                    'priority_booking' => 'Priority booking for private and travel sessions',
                    'custom_content' => 'Custom content briefs & quarterly collaborations',
                    'mastermind' => 'Annual invite to in-person mastermind',
                ],
                'is_active' => true,
                'is_public' => true,
                'display_order' => 3,
                'allows_recurring' => true,
                'allows_one_time' => true,
                'one_time_duration_days' => 30,
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

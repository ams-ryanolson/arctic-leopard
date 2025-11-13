<?php

namespace Database\Seeders;

use App\Enums\Ads\AdSize;
use App\Models\Ads\AdPlacement;
use Illuminate\Database\Seeder;

class AdPlacementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $placements = [
            [
                'key' => 'timeline_inline',
                'name' => 'Timeline Inline',
                'description' => 'Ads displayed inline within the timeline feed',
                'allowed_sizes' => [AdSize::Small->value, AdSize::Medium->value],
                'default_weight' => 100,
                'is_active' => true,
            ],
            [
                'key' => 'dashboard_sidebar_small',
                'name' => 'Dashboard Sidebar Small',
                'description' => 'Small ads in the dashboard sidebar',
                'allowed_sizes' => [AdSize::Small->value, AdSize::Square->value],
                'default_weight' => 100,
                'is_active' => true,
            ],
            [
                'key' => 'dashboard_sidebar_medium',
                'name' => 'Dashboard Sidebar Medium',
                'description' => 'Medium ads in the dashboard sidebar',
                'allowed_sizes' => [AdSize::Medium->value],
                'default_weight' => 100,
                'is_active' => true,
            ],
            [
                'key' => 'dashboard_sidebar_large',
                'name' => 'Dashboard Sidebar Large',
                'description' => 'Large ads in the dashboard sidebar',
                'allowed_sizes' => [AdSize::Large->value, AdSize::Banner->value],
                'default_weight' => 100,
                'is_active' => true,
            ],
        ];

        foreach ($placements as $placement) {
            AdPlacement::updateOrCreate(
                ['key' => $placement['key']],
                $placement
            );
        }
    }
}

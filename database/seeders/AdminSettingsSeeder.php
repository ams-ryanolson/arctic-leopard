<?php

namespace Database\Seeders;

use App\Models\AdminSetting;
use Illuminate\Database\Seeder;

class AdminSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'key' => 'id_verification_expires_after_years',
                'value' => '1',
                'description' => 'Number of years before ID verification expires (1 or 2 years)',
                'type' => 'integer',
                'category' => 'verification',
            ],
            [
                'key' => 'id_verification_grace_period_days',
                'value' => '30',
                'description' => 'Number of days after expiration before creator status is disabled',
                'type' => 'integer',
                'category' => 'verification',
            ],
            [
                'key' => 'id_verification_provider',
                'value' => 'sumsub',
                'description' => 'Default ID verification provider',
                'type' => 'string',
                'category' => 'verification',
            ],
        ];

        foreach ($settings as $setting) {
            AdminSetting::query()->updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}

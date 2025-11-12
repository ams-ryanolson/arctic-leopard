<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Run with: php artisan migrate:fresh --seed --seeder=Database\Seeders\DatabaseSeeder
     */
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            InterestSeeder::class,
            CircleSeeder::class,
            HashtagSeeder::class,
            SampleContentSeeder::class,
        ]);

        // BusySiteSeeder intentionally disabled for now; run manually if needed.

        $username = $this->resolveSeedUsername();

        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'username' => $username,
                'username_lower' => Str::lower($username),
                'name' => 'Test User',
                'display_name' => 'Test User',
                'pronouns' => 'he/him',
                'bio' => "Builder of Real Kink Men.\n\nThis seeded account helps demo new features.",
                'birthdate' => now()->subYears(30)->format('Y-m-d'),
                'location_city' => 'San Francisco',
                'location_region' => 'CA',
                'location_country' => 'USA',
                'location_latitude' => 37.7749,
                'location_longitude' => -122.4194,
                'accepted_terms_at' => now(),
                'accepted_privacy_at' => now(),
                'profile_completed_at' => now(),
                'password' => 'password',
                'email_verified_at' => now(),
            ]
        );

        if (method_exists($user, 'assignRole') && ! $user->hasRole('Super Admin')) {
            $user->assignRole('Super Admin');
        }
    }

    protected function resolveSeedUsername(): string
    {
        $base = 'testuser';
        $candidate = $base;
        $suffix = 1;

        while (
            User::where('username_lower', Str::lower($candidate))
                ->where('email', '<>', 'test@example.com')
                ->exists()
        ) {
            $candidate = "{$base}{$suffix}";
            $suffix++;
        }

        return $candidate;
    }
}

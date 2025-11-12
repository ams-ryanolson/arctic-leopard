<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $username = Str::of(fake()->unique()->userName())
            ->lower()
            ->replaceMatches('/[^a-z0-9._-]/', '')
            ->trim('-_.')
            ->limit(30, '')
            ->value();

        if ($username === '') {
            $username = 'user'.fake()->unique()->numberBetween(1000, 9999);
        }

        $city = fake()->city();
        $region = fake()->optional()->state();
        $country = fake()->country();

        return [
            'username' => $username,
            'username_lower' => Str::lower($username),
            'name' => fake()->name(),
            'display_name' => fake()->name(),
            'pronouns' => fake()->randomElement(['he/him', 'she/her', 'they/them', 'he/they', 'she/they']),
            'bio' => implode("\n\n", fake()->paragraphs(rand(1, 3))),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'birthdate' => fake()->dateTimeBetween('-60 years', '-18 years')->format('Y-m-d'),
            'location_city' => $city,
            'location_region' => $region,
            'location_country' => $country,
            'location_latitude' => (float) fake()->latitude(),
            'location_longitude' => (float) fake()->longitude(),
            'accepted_terms_at' => now(),
            'accepted_privacy_at' => now(),
            'profile_completed_at' => now(),
            'is_traveling' => false,
            'requires_follow_approval' => false,
            'password' => static::$password ??= 'password',
            'remember_token' => Str::random(10),
            'two_factor_secret' => Str::random(10),
            'two_factor_recovery_codes' => Str::random(10),
            'two_factor_confirmed_at' => now(),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the model does not have two-factor authentication configured.
     */
    public function withoutTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ]);
    }

    /**
     * Ensure freshly created users receive the baseline role assignment.
     */
    public function configure(): static
    {
        return $this->afterCreating(function (User $user): void {
            if (! method_exists($user, 'assignRole')) {
                return;
            }

            if (
                $user->hasAnyRole([
                    'Super Admin',
                    'Admin',
                    'Moderator',
                    'Creator',
                    'Premium',
                    'User',
                ])
            ) {
                return;
            }

            if (Role::query()->where('name', 'User')->exists()) {
                $user->assignRole('User');
            }
        });
    }
}

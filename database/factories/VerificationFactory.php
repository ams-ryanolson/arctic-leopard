<?php

namespace Database\Factories;

use App\Enums\VerificationProvider;
use App\Enums\VerificationStatus;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Verification>
 */
class VerificationFactory extends Factory
{
    protected $model = Verification::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'provider' => VerificationProvider::Sumsub,
            'provider_applicant_id' => 'test-applicant-'.fake()->uuid(),
            'status' => VerificationStatus::Pending,
            'verified_at' => null,
            'expires_at' => null,
            'renewal_required_at' => null,
            'creator_status_disabled_at' => null,
            'compliance_note' => null,
            'metadata' => null,
        ];
    }

    /**
     * Indicate that the verification is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => VerificationStatus::Approved,
            'verified_at' => now(),
            'expires_at' => now()->addYear(),
        ]);
    }

    /**
     * Indicate that the verification is rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => VerificationStatus::Rejected,
            'metadata' => [
                'rejection_reason' => 'Document quality insufficient',
            ],
        ]);
    }

    /**
     * Indicate that the verification requires renewal.
     */
    public function renewalRequired(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => VerificationStatus::RenewalRequired,
            'renewal_required_at' => now(),
            'expires_at' => now()->addDays(30),
        ]);
    }
}

<?php

namespace Database\Factories;

use App\Enums\AppealStatus;
use App\Enums\AppealType;
use App\Models\User;
use App\Models\UserAppeal;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UserAppeal>
 */
class UserAppealFactory extends Factory
{
    protected $model = UserAppeal::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'appeal_type' => fake()->randomElement(AppealType::cases()),
            'reason' => fake()->paragraph(),
            'status' => AppealStatus::Pending,
            'reviewed_by_id' => null,
            'reviewed_at' => null,
            'review_notes' => null,
        ];
    }

    /**
     * Set appeal as pending.
     */
    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => AppealStatus::Pending,
        ]);
    }

    /**
     * Set appeal as approved.
     */
    public function approved(): static
    {
        return $this->state(fn () => [
            'status' => AppealStatus::Approved,
            'reviewed_by_id' => User::factory(),
            'reviewed_at' => now(),
        ]);
    }

    /**
     * Set appeal as rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn () => [
            'status' => AppealStatus::Rejected,
            'reviewed_by_id' => User::factory(),
            'reviewed_at' => now(),
        ]);
    }

    /**
     * Set appeal type to suspension.
     */
    public function forSuspension(): static
    {
        return $this->state(fn () => [
            'appeal_type' => AppealType::Suspension,
        ]);
    }

    /**
     * Set appeal type to ban.
     */
    public function forBan(): static
    {
        return $this->state(fn () => [
            'appeal_type' => AppealType::Ban,
        ]);
    }
}

<?php

namespace Database\Factories\Payments;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<array<string, mixed>>
 */
class PaymentSubscriptionFactory extends Factory
{
    /**
     * @var class-string<\App\Models\Payments\PaymentSubscription>
     */
    protected $model = 'App\\Models\\Payments\\PaymentSubscription';

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $amount = fake()->numberBetween(1000, 10000);

        return [
            'uuid' => (string) Str::uuid(),
            'subscriber_id' => fn () => \App\Models\User::factory(),
            'creator_id' => fn () => \App\Models\User::factory(),
            'subscription_plan_id' => fn () => \App\Models\Payments\SubscriptionPlan::factory(),
            'payment_method_id' => fn () => \App\Models\Payments\PaymentMethod::factory(),
            'status' => fake()->randomElement(['pending', 'trialing', 'active', 'past_due']),
            'provider' => 'fake',
            'provider_subscription_id' => Str::uuid()->toString(),
            'auto_renews' => true,
            'amount' => $amount,
            'currency' => 'USD',
            'interval' => 'monthly',
            'interval_count' => 1,
            'trial_ends_at' => now()->addDays(7),
            'starts_at' => now(),
            'ends_at' => now()->addMonth(),
            'grace_ends_at' => null,
            'cancelled_at' => null,
            'cancellation_reason' => null,
            'last_synced_at' => now(),
            'metadata' => [
                'source' => 'factory',
            ],
        ];
    }
}

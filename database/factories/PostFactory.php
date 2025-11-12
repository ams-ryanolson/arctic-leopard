<?php

namespace Database\Factories;

use App\Enums\PostAudience;
use App\Enums\PostType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<\App\Models\Post>
 */
class PostFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $payToView = $this->faker->boolean(20);

        return [
            'user_id' => User::factory(),
            'type' => Arr::random(PostType::values()),
            'audience' => $payToView ? PostAudience::PayToView->value : Arr::random(PostAudience::values()),
            'is_system' => false,
            'is_pinned' => false,
            'body' => $this->faker->paragraphs(asText: true),
            'extra_attributes' => null,
            'likes_count' => 0,
            'comments_count' => 0,
            'reposts_count' => 0,
            'poll_votes_count' => 0,
            'views_count' => 0,
            'paywall_price' => $payToView ? $this->faker->numberBetween(500, 2500) : null,
            'paywall_currency' => $payToView ? 'USD' : null,
            'scheduled_at' => null,
            'published_at' => Carbon::instance($this->faker->dateTimeBetween('-45 days', 'now')),
            'expires_at' => null,
        ];
    }

    /**
     * Indicate that the post is a system announcement.
     *
     * @return $this
     */
    public function system(): static
    {
        return $this->state(fn () => [
            'type' => PostType::System->value,
            'is_system' => true,
        ]);
    }

    /**
     * Indicate that the post should be a text post.
     *
     * @return $this
     */
    public function text(): static
    {
        return $this->type(PostType::Text);
    }

    /**
     * Indicate that the post should be a media post.
     *
     * @return $this
     */
    public function media(): static
    {
        return $this->type(PostType::Media);
    }

    /**
     * Indicate that the post should be a poll post.
     *
     * @return $this
     */
    public function poll(): static
    {
        return $this->type(PostType::Poll);
    }

    /**
     * Indicate that the post should require a paywall purchase.
     *
     * @return $this
     */
    public function payToView(?int $price = null, string $currency = 'USD'): static
    {
        return $this->state(function () use ($price, $currency) {
            $resolvedPrice = $price ?? $this->faker->numberBetween(500, 2500);

            return [
                'audience' => PostAudience::PayToView->value,
                'paywall_price' => $resolvedPrice,
                'paywall_currency' => $currency,
            ];
        });
    }

    /**
     * Set a specific post type.
     *
     * @return $this
     */
    public function type(PostType $type): static
    {
        return $this->state(fn () => ['type' => $type->value]);
    }

    /**
     * Set a specific post audience.
     *
     * @return $this
     */
    public function audience(PostAudience $audience): static
    {
        return $this->state(fn () => ['audience' => $audience->value]);
    }

    /**
     * Randomize the publication timestamp within the last given days.
     *
     * @return $this
     */
    public function publishedWithinLastDays(int $days = 30): static
    {
        return $this->state(fn () => [
            'published_at' => Carbon::instance(
                $this->faker->dateTimeBetween("-{$days} days", 'now'),
            ),
        ]);
    }
}

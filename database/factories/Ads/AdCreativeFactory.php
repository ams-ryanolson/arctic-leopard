<?php

namespace Database\Factories\Ads;

use App\Enums\Ads\AdPlacement;
use App\Enums\Ads\AdSize;
use App\Enums\Ads\CreativeAssetType;
use App\Models\Ads\Ad;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Arr;

/**
 * @extends Factory<AdCreative>
 */
class AdCreativeFactory extends Factory
{
    protected $model = \App\Models\Ads\AdCreative::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $placement = Arr::random(AdPlacement::values());
        $size = Arr::random(AdSize::values());
        $assetType = Arr::random(CreativeAssetType::values());

        return [
            'ad_id' => Ad::factory(),
            'placement' => $placement,
            'size' => $size,
            'asset_type' => $assetType,
            'asset_path' => $this->faker->boolean(70) ? 'ads/'.$this->faker->uuid().'.jpg' : null,
            'asset_url' => $this->faker->boolean(30) ? $this->faker->imageUrl() : null,
            'headline' => $this->faker->sentence(4),
            'body_text' => $this->faker->optional()->paragraph(),
            'cta_text' => $this->faker->randomElement(['Learn More', 'Shop Now', 'Get Started', 'Sign Up']),
            'cta_url' => $this->faker->url(),
            'display_order' => 0,
            'is_active' => true,
            'review_status' => 'approved',
            'reviewed_at' => now(),
            'reviewed_by' => User::factory(),
            'metadata' => null,
        ];
    }

    /**
     * Indicate that the creative is pending review.
     *
     * @return $this
     */
    public function pending(): static
    {
        return $this->state(fn () => [
            'review_status' => 'pending',
            'reviewed_at' => null,
            'reviewed_by' => null,
        ]);
    }
}

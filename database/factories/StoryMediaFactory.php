<?php

namespace Database\Factories;

use App\Models\Story;
use App\Models\StoryMedia;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StoryMedia>
 */
class StoryMediaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'story_id' => Story::factory(),
            'disk' => 'public',
            'path' => 'stories/'.$this->faker->uuid().'.jpg',
            'original_path' => null,
            'optimized_path' => null,
            'thumbnail_path' => null,
            'blur_path' => null,
            'mime_type' => 'image/jpeg',
            'width' => $this->faker->numberBetween(400, 1920),
            'height' => $this->faker->numberBetween(600, 2560),
            'duration' => null,
            'size' => $this->faker->numberBetween(100000, 5000000),
            'meta' => [],
            'processing_status' => 'completed',
            'processing_meta' => null,
            'processing_error' => null,
        ];
    }

    /**
     * Indicate that the media is a video.
     *
     * @return $this
     */
    public function video(): static
    {
        return $this->state(fn () => [
            'mime_type' => 'video/mp4',
            'path' => 'stories/'.$this->faker->uuid().'.mp4',
            'duration' => $this->faker->numberBetween(5, 60),
            'size' => $this->faker->numberBetween(1000000, 50000000),
        ]);
    }

    /**
     * Indicate that the media has a blurred preview.
     *
     * @return $this
     */
    public function withBlurredPreview(): static
    {
        return $this->state(fn () => [
            'blur_path' => 'stories/blurred/'.$this->faker->uuid().'.jpg',
        ]);
    }

    /**
     * Indicate that the media has a thumbnail.
     *
     * @return $this
     */
    public function withThumbnail(): static
    {
        return $this->state(fn () => [
            'thumbnail_path' => 'stories/thumbnails/'.$this->faker->uuid().'.jpg',
        ]);
    }
}

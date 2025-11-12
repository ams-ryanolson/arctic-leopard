<?php

namespace Database\Factories;

use App\Models\Post;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<\App\Models\PostMedia>
 */
class PostMediaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return $this->imageState();
    }

    /**
     * Indicate that the media item is the primary attachment.
     *
     * @return $this
     */
    public function primary(): static
    {
        return $this->state(fn () => ['is_primary' => true]);
    }

    /**
     * Indicate that the media item should represent an image.
     *
     * @return $this
     */
    public function image(): static
    {
        return $this->state(fn () => $this->imageState());
    }

    /**
     * Indicate that the media item should represent a video.
     *
     * @return $this
     */
    public function video(): static
    {
        return $this->state(fn () => $this->videoState());
    }

    /**
     * Build the default image media state.
     *
     * @return array<string, mixed>
     */
    protected function imageState(): array
    {
        return [
            'post_id' => Post::factory(),
            'disk' => 'public',
            'path' => 'media/' . Str::uuid() . '.jpg',
            'thumbnail_path' => null,
            'mime_type' => 'image/jpeg',
            'position' => 0,
            'width' => $this->faker->numberBetween(1280, 4096),
            'height' => $this->faker->numberBetween(720, 4096),
            'duration' => null,
            'meta' => [],
            'is_primary' => false,
        ];
    }

    /**
     * Build the default video media state.
     *
     * @return array<string, mixed>
     */
    protected function videoState(): array
    {
        return [
            'post_id' => Post::factory(),
            'disk' => 'public',
            'path' => 'media/' . Str::uuid() . '.mp4',
            'thumbnail_path' => 'media/' . Str::uuid() . '.jpg',
            'mime_type' => 'video/mp4',
            'position' => 0,
            'width' => 1920,
            'height' => 1080,
            'duration' => $this->faker->numberBetween(10, 240),
            'meta' => [],
            'is_primary' => false,
        ];
    }
}

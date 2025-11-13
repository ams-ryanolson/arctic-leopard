<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\EventMedia;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Arr;

/**
 * @extends Factory<EventMedia>
 */
class EventMediaFactory extends Factory
{
    protected $model = EventMedia::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $mediaType = Arr::random(['image', 'video']);

        return [
            'event_id' => Event::factory(),
            'uploaded_by_id' => User::factory(),
            'disk' => 'public',
            'path' => $mediaType === 'image'
                ? 'events/'.$this->faker->uuid().'.jpg'
                : 'events/'.$this->faker->uuid().'.mp4',
            'thumbnail_path' => $mediaType === 'video'
                ? 'events/'.$this->faker->uuid().'_thumb.jpg'
                : null,
            'media_type' => $mediaType,
            'title' => $this->faker->optional()->sentence(3),
            'caption' => $this->faker->optional()->sentence(),
            'position' => $this->faker->numberBetween(0, 20),
            'meta' => $mediaType === 'video'
                ? ['duration_seconds' => $this->faker->numberBetween(30, 300)]
                : ['dimensions' => '1920x1080'],
        ];
    }

    /**
     * Indicate the media is an image.
     *
     * @return $this
     */
    public function image(): static
    {
        return $this->state(fn () => [
            'media_type' => 'image',
            'thumbnail_path' => null,
        ]);
    }

    /**
     * Indicate the media is a video.
     *
     * @return $this
     */
    public function video(): static
    {
        return $this->state(fn () => [
            'media_type' => 'video',
            'thumbnail_path' => 'events/'.$this->faker->uuid().'_thumb.jpg',
        ]);
    }
}

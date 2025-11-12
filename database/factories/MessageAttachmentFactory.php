<?php

namespace Database\Factories;

use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<\App\Models\MessageAttachment>
 */
class MessageAttachmentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $disk = config('filesystems.default', 's3');
        $extension = $this->faker->randomElement(['jpg', 'png', 'gif']);

        return [
            'message_id' => Message::factory(),
            'uploaded_by_id' => User::factory(),
            'type' => 'image',
            'disk' => $disk,
            'path' => sprintf('messages/%s/%s.%s', Str::random(8), Str::uuid(), $extension),
            'filename' => $this->faker->lexify('attachment-????').'.'.$extension,
            'mime_type' => 'image/'.$extension,
            'size' => $this->faker->numberBetween(10_000, 2_000_000),
            'width' => $this->faker->numberBetween(320, 1920),
            'height' => $this->faker->numberBetween(320, 1080),
            'duration' => null,
            'ordering' => 0,
            'is_inline' => false,
            'is_primary' => false,
            'meta' => [
                'blurhash' => null,
            ],
            'transcode_job' => null,
        ];
    }

    public function image(): static
    {
        return $this->state(fn () => [
            'type' => 'image',
            'mime_type' => 'image/jpeg',
            'duration' => null,
        ]);
    }

    public function video(): static
    {
        return $this->state(fn () => [
            'type' => 'video',
            'mime_type' => 'video/mp4',
            'duration' => $this->faker->numberBetween(1, 600),
        ]);
    }

    public function audio(): static
    {
        return $this->state(fn () => [
            'type' => 'audio',
            'mime_type' => 'audio/mpeg',
            'duration' => $this->faker->numberBetween(1, 600),
            'width' => null,
            'height' => null,
        ]);
    }
}

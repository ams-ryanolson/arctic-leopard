<?php

use App\Http\Resources\PostMediaResource;
use App\Models\PostMedia;
use Illuminate\Support\Facades\Storage;

it('includes optimized_url and optimized_path when optimized_path exists', function () {
    Storage::fake('public');

    Storage::disk('public')->put('uploads/example.jpg', 'content');
    Storage::disk('public')->put('uploads/example-optimized.webp', 'optimized content');

    $media = PostMedia::factory()->make([
        'post_id' => null,
        'disk' => 'public',
        'path' => 'uploads/example.jpg',
        'optimized_path' => 'uploads/example-optimized.webp',
    ]);

    $resource = new PostMediaResource($media);
    $array = $resource->toArray(request());

    expect($array)
        ->toHaveKey('optimized_path')
        ->toHaveKey('optimized_url')
        ->and($array['optimized_path'])->toBe('uploads/example-optimized.webp')
        ->and($array['optimized_url'])->toStartWith('http')
        ->and($array['optimized_url'])->toContain('uploads/example-optimized.webp');
});

it('includes optimized_url as null when optimized_path is null', function () {
    Storage::fake('public');

    Storage::disk('public')->put('uploads/example.jpg', 'content');

    $media = PostMedia::factory()->make([
        'post_id' => null,
        'disk' => 'public',
        'path' => 'uploads/example.jpg',
        'optimized_path' => null,
    ]);

    $resource = new PostMediaResource($media);
    $array = $resource->toArray(request());

    expect($array)
        ->toHaveKey('optimized_path')
        ->toHaveKey('optimized_url')
        ->and($array['optimized_path'])->toBeNull()
        ->and($array['optimized_url'])->toBeNull();
});

it('generates absolute url for optimized_path', function () {
    Storage::fake('public');

    Storage::disk('public')->put('uploads/example-optimized.webp', 'optimized content');

    $media = PostMedia::factory()->make([
        'post_id' => null,
        'disk' => 'public',
        'path' => 'uploads/example.jpg',
        'optimized_path' => 'uploads/example-optimized.webp',
    ]);

    $resource = new PostMediaResource($media);
    $array = $resource->toArray(request());

    expect($array['optimized_url'])
        ->toStartWith('http')
        ->toContain('uploads/example-optimized.webp');
});

it('includes all required fields including optimized fields', function () {
    Storage::fake('public');

    Storage::disk('public')->put('uploads/example.jpg', 'content');
    Storage::disk('public')->put('uploads/example-thumb.jpg', 'thumbnail');
    Storage::disk('public')->put('uploads/example-optimized.webp', 'optimized');
    Storage::disk('public')->put('uploads/example-blur.webp', 'blur');

    $media = PostMedia::factory()->make([
        'post_id' => null,
        'disk' => 'public',
        'path' => 'uploads/example.jpg',
        'thumbnail_path' => 'uploads/example-thumb.jpg',
        'optimized_path' => 'uploads/example-optimized.webp',
        'blur_path' => 'uploads/example-blur.webp',
        'mime_type' => 'image/jpeg',
        'position' => 0,
        'width' => 1920,
        'height' => 1080,
        'is_primary' => true,
    ]);

    $resource = new PostMediaResource($media);
    $array = $resource->toArray(request());

    expect($array)->toHaveKeys([
        'id',
        'disk',
        'path',
        'url',
        'thumbnail_path',
        'thumbnail_url',
        'optimized_path',
        'optimized_url',
        'blur_path',
        'blur_url',
        'mime_type',
        'type',
        'position',
        'width',
        'height',
        'duration',
        'is_primary',
        'meta',
        'alt',
    ]);

    expect($array['blur_url'])->toStartWith('http');
    expect($array['blur_path'])->toBe('uploads/example-blur.webp');
});

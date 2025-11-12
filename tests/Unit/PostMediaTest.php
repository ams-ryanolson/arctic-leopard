<?php

use App\Models\PostMedia;
use Illuminate\Support\Facades\Storage;

it('returns an absolute url for stored media', function () {
    Storage::fake('public');

    Storage::disk('public')->put('uploads/example.jpg', 'content');
    Storage::disk('public')->put('uploads/example-thumb.jpg', 'thumbnail');

    $media = PostMedia::factory()->make([
        'post_id' => null,
        'disk' => 'public',
        'path' => 'uploads/example.jpg',
        'thumbnail_path' => 'uploads/example-thumb.jpg',
    ]);

    expect($media->url)->toStartWith('http');
    expect($media->url)->toContain('uploads/example.jpg');

    expect($media->thumbnail_url)->toStartWith('http');
    expect($media->thumbnail_url)->toContain('uploads/example-thumb.jpg');
});

it('normalizes leading slashes before generating urls', function () {
    Storage::fake('public');

    Storage::disk('public')->put('uploads/example.jpg', 'content');

    $media = PostMedia::factory()->make([
        'post_id' => null,
        'disk' => 'public',
        'path' => '/uploads/example.jpg',
        'thumbnail_path' => '/uploads/example.jpg',
    ]);

    expect($media->url)->toStartWith('http');
    expect($media->url)->toContain('uploads/example.jpg');
    expect($media->thumbnail_url)->toStartWith('http');
    expect($media->thumbnail_url)->toContain('uploads/example.jpg');
});

it('still returns a url when media file is missing', function () {
    Storage::fake('public');

    $media = PostMedia::factory()->make([
        'post_id' => null,
        'disk' => 'public',
        'path' => 'uploads/missing.jpg',
        'thumbnail_path' => 'uploads/missing-thumb.jpg',
    ]);

    expect($media->url)->toStartWith('http');
    expect($media->url)->toContain('uploads/missing.jpg');

    expect($media->thumbnail_url)->toStartWith('http');
    expect($media->thumbnail_url)->toContain('uploads/missing-thumb.jpg');
});

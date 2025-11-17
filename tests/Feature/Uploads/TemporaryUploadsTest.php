<?php

use App\Models\User;
use App\Services\TemporaryUploadService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;

beforeEach(function (): void {
    Config::set('uploads.temporary_disk', 'local');
    Config::set('filesystems.default', 'public');

    Storage::fake('local');
    Storage::fake('public');
});

it('allows authenticated users to store and delete temporary uploads', function (): void {
    $user = User::factory()->create();

    actingAs($user)
        ->post('/uploads/tmp', [
            'file' => UploadedFile::fake()->image('avatar.jpg'),
        ], [
            'Accept' => 'application/json',
        ])
        ->assertSuccessful()
        ->tap(function ($response): void {
            $json = $response->json();

            expect($json)
                ->toHaveKey('id')
                ->toHaveKey('filename')
                ->toHaveKey('path')
                ->toHaveKey('url')
                ->toHaveKey('thumbnail_url');

            expect($json['url'])->toBe(route('uploads.tmp.show', ['upload' => $json['id']]));
            expect($json['thumbnail_url'])->toBe(route('uploads.tmp.show', ['upload' => $json['id']]));

            Storage::disk('local')->assertExists($json['path']);

            $deleteResponse = $this->call('DELETE', '/uploads/tmp', [], [], [], [], $json['id']);
            $deleteResponse->assertNoContent();

            Storage::disk('local')->assertMissing($json['path']);
        });
});

it('moves temporary uploads into permanent storage during onboarding', function (): void {
    $user = User::factory()->create();
    $temporaryUploads = app(TemporaryUploadService::class);

    $storedAvatar = $temporaryUploads->store(UploadedFile::fake()->image('avatar.png', 400, 400));
    $storedCover = $temporaryUploads->store(UploadedFile::fake()->image('cover.jpg', 1800, 900));

    $response = actingAs($user)->from(route('onboarding.media'))->put(route('onboarding.media.update'), [
        'avatar_upload_id' => $storedAvatar['identifier'],
        'cover_upload_id' => $storedCover['identifier'],
    ]);

    $response->assertRedirect(route('onboarding.follow'));

    $user->refresh();
    expect($user->avatar_path)->not()->toBeNull();
    expect($user->cover_path)->not()->toBeNull();

    Storage::disk('public')->assertExists($user->avatar_path);
    Storage::disk('public')->assertExists($user->cover_path);

    Storage::disk('local')->assertMissing($storedAvatar['path']);
    Storage::disk('local')->assertMissing($storedCover['path']);
});

it('rejects missing or expired temporary uploads', function (): void {
    $user = User::factory()->create();

    actingAs($user)
        ->from(route('onboarding.media'))
        ->put(route('onboarding.media.update'), [
            'avatar_upload_id' => 'expired-id',
            'cover_upload_id' => null,
        ])
        ->assertSessionHasErrors('avatar_upload_id');
});

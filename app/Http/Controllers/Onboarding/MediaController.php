<?php

namespace App\Http\Controllers\Onboarding;

use App\Http\Requests\Onboarding\MediaRequest;
use App\Services\TemporaryUploadService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MediaController
{
    public function __construct(
        protected TemporaryUploadService $temporaryUploads,
    ) {
    }

    public function show(Request $request): Response
    {
        $user = $request->user();
        $age = $user->birthdate ? Carbon::parse($user->birthdate)->age : null;

        return Inertia::render('Onboarding/Media', [
            'profile' => [
                'display_name' => $user->display_name,
                'username' => $user->username,
                'pronouns' => $user->pronouns,
                'bio' => $user->bio,
                'age' => $age,
                'location_city' => $user->location_city,
                'location_region' => $user->location_region,
                'location_country' => $user->location_country,
                'hashtags' => $user->hashtags()->pluck('name'),
                'interests' => $user->interests()->pluck('name'),
                'avatar_path' => $user->avatar_path,
                'avatar_url' => $user->avatar_url,
                'cover_path' => $user->cover_path,
                'cover_url' => $user->cover_url,
            ],
        ]);
    }

    public function update(MediaRequest $request): RedirectResponse
    {
        $user = $request->user();
        $updates = [];

        $avatarIdentifier = $request->string('avatar_upload_id')->toString();
        if ($avatarIdentifier !== '') {
            $avatarPath = $this->promoteUpload($avatarIdentifier, "users/{$user->id}", 'avatar');

            if ($avatarPath !== null) {
                $this->deleteMedia($user->avatar_path);
                $updates['avatar_path'] = $avatarPath;
            }
        }

        $coverIdentifier = $request->string('cover_upload_id')->toString();
        if ($coverIdentifier !== '') {
            $coverPath = $this->promoteUpload($coverIdentifier, "users/{$user->id}", 'cover');

            if ($coverPath !== null) {
                $this->deleteMedia($user->cover_path);
                $updates['cover_path'] = $coverPath;
            }
        }

        if (! empty($updates)) {
            $user->forceFill($updates)->save();
        }

        return redirect()->route('onboarding.follow');
    }

    protected function promoteUpload(string $identifier, string $directory, string $basename): ?string
    {
        $temporaryPath = $this->temporaryUploads->resolvePath($identifier);

        if ($temporaryPath === null) {
            return null;
        }

        $extension = pathinfo($temporaryPath, PATHINFO_EXTENSION);
        $filename = $extension !== '' ? "{$basename}.{$extension}" : $basename;

        return $this->temporaryUploads->promote($identifier, $directory, $filename);
    }

    protected function deleteMedia(?string $path): void
    {
        if (! $path) {
            return;
        }

        $disk = Storage::disk(config('filesystems.default'));

        if ($disk->exists($path)) {
            $disk->delete($path);
        }
    }
}


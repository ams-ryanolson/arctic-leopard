<?php

namespace App\Http\Controllers\Onboarding;

use App\Http\Requests\Onboarding\MediaRequest;
use App\Services\TemporaryUploadService;
use App\Services\Users\UserMediaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class MediaController
{
    public function __construct(
        protected TemporaryUploadService $temporaryUploads,
        protected UserMediaService $userMediaService,
    ) {}

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
            $avatarPath = $this->userMediaService->updateAvatar($user, $avatarIdentifier);

            if ($avatarPath !== null) {
                $updates['avatar_path'] = $avatarPath;
            }
        }

        $coverIdentifier = $request->string('cover_upload_id')->toString();
        if ($coverIdentifier !== '') {
            $coverPath = $this->userMediaService->updateCover($user, $coverIdentifier);

            if ($coverPath !== null) {
                $updates['cover_path'] = $coverPath;
            }
        }

        if (! empty($updates)) {
            $user->forceFill($updates)->save();
        }

        return redirect()->route('onboarding.follow');
    }
}

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
        try {
            \Log::info('MediaController: update called', [
                'user_id' => $request->user()->id,
                'avatar_upload_id' => $request->input('avatar_upload_id'),
                'cover_upload_id' => $request->input('cover_upload_id'),
                'all_input' => $request->all(),
            ]);

            $user = $request->user();
            $updates = [];
            $errors = [];

            $avatarIdentifier = $request->string('avatar_upload_id')->toString();
            if ($avatarIdentifier !== '') {
                \Log::info('MediaController: processing avatar', ['identifier' => $avatarIdentifier]);
                try {
                    $avatarPath = $this->userMediaService->updateAvatar($user, $avatarIdentifier);

                    if ($avatarPath === null) {
                        \Log::warning('MediaController: avatar promotion failed', ['identifier' => $avatarIdentifier]);
                        $errors['avatar_upload_id'] = 'Failed to process avatar upload. Please try uploading again.';
                    } else {
                        \Log::info('MediaController: avatar processed successfully', ['path' => $avatarPath]);
                        $updates['avatar_path'] = $avatarPath;
                    }
                } catch (\Throwable $e) {
                    \Log::error('MediaController: avatar processing exception', [
                        'identifier' => $avatarIdentifier,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                    $errors['avatar_upload_id'] = 'An error occurred while processing your avatar. Please try again.';
                }
            }

            $coverIdentifier = $request->string('cover_upload_id')->toString();
            if ($coverIdentifier !== '') {
                \Log::info('MediaController: processing cover', ['identifier' => $coverIdentifier]);
                try {
                    $coverPath = $this->userMediaService->updateCover($user, $coverIdentifier);

                    if ($coverPath === null) {
                        \Log::warning('MediaController: cover promotion failed', ['identifier' => $coverIdentifier]);
                        $errors['cover_upload_id'] = 'Failed to process cover upload. Please try uploading again.';
                    } else {
                        \Log::info('MediaController: cover processed successfully', ['path' => $coverPath]);
                        $updates['cover_path'] = $coverPath;
                    }
                } catch (\Throwable $e) {
                    \Log::error('MediaController: cover processing exception', [
                        'identifier' => $coverIdentifier,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                    $errors['cover_upload_id'] = 'An error occurred while processing your cover. Please try again.';
                }
            }

            if (! empty($errors)) {
                \Log::warning('MediaController: returning with errors', ['errors' => $errors]);

                return back()->withErrors($errors);
            }

            if (! empty($updates)) {
                $user->forceFill($updates)->save();
                \Log::info('MediaController: user updated', ['updates' => $updates]);
            } else {
                \Log::info('MediaController: no updates to apply');
            }

            return redirect()->route('onboarding.follow');
        } catch (\Throwable $e) {
            \Log::error('MediaController: update exception', [
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors([
                'general' => 'An unexpected error occurred. Please try again.',
            ]);
        }
    }
}

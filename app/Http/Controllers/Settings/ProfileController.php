<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Http\Requests\Settings\UpdateMediaRequest;
use App\Http\Resources\CircleResource;
use App\Models\Hashtag;
use App\Models\Interest;
use App\Models\User;
use App\Services\Circles\CircleMembershipService;
use App\Services\UserFollowService;
use App\Services\Users\UserMediaService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(
        private readonly CircleMembershipService $circleMemberships,
        private readonly UserMediaService $userMediaService,
    ) {}

    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        $interests = Interest::query()
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'description']);

        $hashtags = Hashtag::query()
            ->orderByDesc('usage_count')
            ->orderBy('name')
            ->limit(30)
            ->get(['id', 'name', 'slug', 'usage_count']);

        $circleMemberships = CircleResource::collection(
            $user->circles()
                ->with([
                    'interest',
                    'facets' => fn ($query) => $query->orderBy('sort_order'),
                ])
                ->orderBy('name')
                ->get()
        )->resolve($request);

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'profile' => [
                'username' => $user->username,
                'email' => $user->email,
                'display_name' => $user->display_name,
                'pronouns' => $user->pronouns,
                'gender' => $user->gender,
                'role' => $user->role,
                'bio' => $user->bio,
                'birthdate' => $user->birthdate?->format('Y-m-d'),
                'location_city' => $user->location_city,
                'location_region' => $user->location_region,
                'location_country' => $user->location_country,
                'interest_ids' => $user->interests()->pluck('interests.id'),
                'hashtags' => $user->hashtags()->pluck('name'),
                'avatar_url' => $user->avatar_url,
                'cover_url' => $user->cover_url,
            ],
            'interests' => $interests,
            'hashtags' => $hashtags,
            'circleMemberships' => $circleMemberships,
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // Update basic profile fields - only update fields that are provided
        $updateData = [
            'username' => $validated['username'],
            'email' => $validated['email'],
        ];

        // Only update optional fields if they are provided
        if (isset($validated['display_name'])) {
            $updateData['display_name'] = $validated['display_name'];
        }
        if (isset($validated['pronouns'])) {
            $updateData['pronouns'] = $validated['pronouns'];
        }
        if (isset($validated['gender'])) {
            $updateData['gender'] = $validated['gender'];
        }
        if (isset($validated['role'])) {
            $updateData['role'] = $validated['role'];
        }
        if (isset($validated['bio'])) {
            $updateData['bio'] = $this->sanitizeBio($validated['bio']);
        }
        if (isset($validated['birthdate'])) {
            $updateData['birthdate'] = $validated['birthdate'];
        }
        if (isset($validated['location_city'])) {
            $updateData['location_city'] = $validated['location_city'];
        }
        if (isset($validated['location_region'])) {
            $updateData['location_region'] = $validated['location_region'];
        }
        if (isset($validated['location_country'])) {
            $updateData['location_country'] = $validated['location_country'];
        }
        $originalRequiresApproval = (bool) $user->getOriginal('requires_follow_approval');

        if (isset($validated['requires_follow_approval'])) {
            $updateData['requires_follow_approval'] = (bool) $validated['requires_follow_approval'];
        }

        $user->forceFill($updateData);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        // If requires_follow_approval was disabled, approve pending followers
        if ($originalRequiresApproval && ! $user->requires_follow_approval) {
            $this->approvePendingFollowers($user);
        }

        // Update interests
        if (isset($validated['interests'])) {
            $selectedInterestIds = collect($validated['interests'])->unique()->values();
            $user->interests()->sync($selectedInterestIds->all());
        }

        // Update hashtags
        if (isset($validated['hashtags'])) {
            $normalizedHashtags = $this->normalizeHashtags(collect($validated['hashtags']));

            $newHashtagIds = $normalizedHashtags
                ->map(function (string $name): int {
                    $slug = Str::slug($name);

                    $hashtag = Hashtag::firstOrCreate(
                        ['slug' => $slug],
                        ['name' => $name]
                    );

                    return $hashtag->id;
                })
                ->all();

            $user->hashtags()->sync($newHashtagIds);
        }

        return to_route('settings.profile.edit');
    }

    /**
     * Update user avatar/cover images
     */
    public function updateMedia(UpdateMediaRequest $request): RedirectResponse
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

        return redirect()
            ->back()
            ->with('status', 'Media updated successfully.');
    }

    private function sanitizeBio(?string $bio): ?string
    {
        if (empty($bio)) {
            return null;
        }

        // Basic HTML sanitization - you may want to use a proper HTML sanitizer
        return strip_tags($bio, '<p><br><strong><em><u><a>');
    }

    private function normalizeHashtags($hashtags)
    {
        return $hashtags
            ->map(function (string $tag): ?string {
                $cleaned = str_replace('#', '', trim($tag));
                $lowered = Str::lower($cleaned);
                $safe = preg_replace('/[^a-z0-9._-]/', '', $lowered);

                return ! empty($safe) ? Str::limit($safe, 60) : null;
            })
            ->filter()
            ->unique();
    }

    private function approvePendingFollowers(User $user): void
    {
        $pendingFollowers = $user->pendingFollowers()->get();
        $followService = app(UserFollowService::class);

        foreach ($pendingFollowers as $pendingFollower) {
            if ($user->hasBlockRelationshipWith($pendingFollower)) {
                continue;
            }

            try {
                $followService->accept($user, $pendingFollower);
            } catch (AuthorizationException) {
                continue;
            }
        }
    }
}

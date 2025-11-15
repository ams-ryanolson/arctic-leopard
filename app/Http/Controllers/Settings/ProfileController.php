<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Http\Resources\CircleResource;
use App\Models\Hashtag;
use App\Models\Interest;
use App\Services\Circles\CircleMembershipService;
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

        // Update basic profile fields
        $user->forceFill([
            'username' => $validated['username'],
            'email' => $validated['email'],
            'display_name' => $validated['display_name'] ?? null,
            'pronouns' => $validated['pronouns'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'role' => $validated['role'] ?? null,
            'bio' => $this->sanitizeBio($validated['bio'] ?? null),
            'birthdate' => $validated['birthdate'] ?? null,
            'location_city' => $validated['location_city'] ?? null,
            'location_region' => $validated['location_region'] ?? null,
            'location_country' => $validated['location_country'] ?? null,
        ]);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

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
}

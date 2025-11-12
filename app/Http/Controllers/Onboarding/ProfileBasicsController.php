<?php

namespace App\Http\Controllers\Onboarding;

use App\Http\Controllers\Controller;
use App\Http\Requests\Onboarding\ProfileBasicsRequest;
use App\Models\Circle;
use App\Models\Hashtag;
use App\Models\Interest;
use App\Services\Circles\CircleMembershipService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProfileBasicsController extends Controller
{
    public function __construct(
        private readonly CircleMembershipService $circleMemberships,
    ) {
    }

    /**
     * Display the profile basics onboarding step.
     */
    public function show(Request $request): Response
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

        return Inertia::render('Onboarding/ProfileBasics', [
            'profile' => [
                'display_name' => $user->display_name,
                'pronouns' => $user->pronouns,
                'bio' => $user->bio,
                'interest_ids' => $user->interests()->pluck('interests.id'),
                'hashtags' => $user->hashtags()->pluck('name'),
            ],
            'interests' => $interests,
            'hashtags' => $hashtags,
        ]);
    }

    /**
     * Persist updates to the user's profile basics.
     */
    public function update(ProfileBasicsRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $user->forceFill([
            'display_name' => $validated['display_name'],
            'pronouns' => $validated['pronouns'] ?? null,
            'bio' => $this->sanitizeBio($validated['bio'] ?? null),
        ])->save();

        $selectedInterestIds = collect($validated['interests'] ?? [])->unique()->values();

        $user->interests()->sync($selectedInterestIds->all());

        if ($selectedInterestIds->isNotEmpty()) {
            $autoEnrollCircles = Circle::query()
                ->whereIn('interest_id', $selectedInterestIds)
                ->get();

            foreach ($autoEnrollCircles as $circle) {
                $this->circleMemberships->join($circle, $user, [
                    'role' => 'member',
                ]);
            }
        }

        $normalizedHashtags = $this->normalizeHashtags(
            collect($validated['hashtags'] ?? [])
        );

        $existingHashtagIds = $user->hashtags()->pluck('hashtags.id')->all();

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

        $changedHashtagIds = array_unique(array_merge($existingHashtagIds, $newHashtagIds));

        if (! empty($changedHashtagIds)) {
            Hashtag::query()
                ->whereIn('id', $changedHashtagIds)
                ->withCount('users')
                ->get()
                ->each(fn (Hashtag $hashtag) => $hashtag->updateQuietly([
                    'usage_count' => $hashtag->users_count,
                ]));
        }

        return redirect()
            ->route('onboarding.media')
            ->with('flash', [
                'banner' => 'Profile basics saved.',
                'bannerStyle' => 'success',
            ]);
    }

    /**
     * Normalize an array of hashtag strings by trimming, removing prefixes,
     * and limiting the final set to a reasonable size.
     *
     * @param  Collection<int, string>  $incoming
     * @return Collection<int, string>
     */
    protected function normalizeHashtags(Collection $incoming): Collection
    {
        return $incoming
            ->map(fn (mixed $value) => is_string($value) ? $value : '')
            ->map(fn (string $tag) => Str::of($tag)->replace('#', '')->lower()->trim()->toString())
            ->filter()
            ->map(fn (string $tag) => Str::replaceMatches('/[^a-z0-9._-]/', '', $tag))
            ->filter()
            ->unique()
            ->take(20)
            ->values();
    }

    /**
     * Sanitize the bio to the allowed tags and remove unwanted attributes.
     */
    protected function sanitizeBio(?string $bio): ?string
    {
        if ($bio === null) {
            return null;
        }

        $bio = trim($bio);

        if ($bio === '') {
            return null;
        }

        $clean = strip_tags($bio, '<strong><em><u><s><br>');
        $clean = preg_replace('/<(strong|em|u|s)\s+[^>]*>/i', '<$1>', $clean) ?? $clean;
        $clean = str_replace('&nbsp;', ' ', $clean);
        $clean = preg_replace('/(<br\s*\/?>\s*){3,}/i', '<br><br>', $clean) ?? $clean;

        return trim($clean) !== '' ? trim($clean) : null;
    }
}


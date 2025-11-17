<?php

namespace App\Services\Circles;

use App\Models\Circle;
use App\Models\User;
use App\Services\Cache\TimelineCacheService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Arr;

class CircleMembershipService
{
    public function __construct(
        private readonly TimelineCacheService $timelineCache,
    ) {}

    /**
     * Add the provided user to the circle, retaining any existing membership metadata.
     *
     * @param  array{
     *     role?: string,
     *     preferences?: array|null,
     *     facet?: string|null,
 }  $attributes
     */
    public function join(Circle $circle, User $user, array $attributes = []): void
    {
        $preferences = Arr::get($attributes, 'preferences', []);

        if ($facet = Arr::get($attributes, 'facet')) {
            $preferences = array_merge($preferences ?? [], ['facet' => $facet]);
        }

        $payload = [
            'role' => Arr::get($attributes, 'role', 'member'),
            'preferences' => $preferences ?: null,
            'joined_at' => Arr::get($attributes, 'joined_at', CarbonImmutable::now()),
        ];

        $membershipQuery = $circle->members()->where('user_id', $user->getKey());

        if ($membershipQuery->exists()) {
            $circle->members()->updateExistingPivot(
                $user->getKey(),
                Arr::except($payload, ['joined_at'])
            );

            $this->timelineCache->forgetForCircle($circle);

            return;
        }

        $circle->members()->attach($user->getKey(), $payload);

        $this->timelineCache->forgetForCircle($circle);
    }

    /**
     * Remove the user from the supplied circle.
     */
    public function leave(Circle $circle, User $user): void
    {
        $circle->members()->detach($user->getKey());

        $this->timelineCache->forgetForCircle($circle);
    }

    /**
     * Determine if the user is already a member of the circle.
     */
    public function isMember(Circle $circle, User $user): bool
    {
        if ($circle->relationLoaded('members')) {
            return $circle->members->contains(fn ($member) => (int) $member->getKey() === (int) $user->getKey());
        }

        return $circle->members()
            ->where('user_id', $user->getKey())
            ->exists();
    }
}

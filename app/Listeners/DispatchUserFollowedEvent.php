<?php

namespace App\Listeners;

use App\Events\UserFollowAccepted;
use App\Events\UserFollowRequested;
use App\Models\User;
use Illuminate\Support\Carbon;
use Overtrue\LaravelFollow\Events\Followed;

class DispatchUserFollowedEvent
{
    /**
     * Handle the event.
     */
    public function handle(Followed $event): void
    {
        $userMorphClass = (new User)->getMorphClass();

        if ($event->followable_type !== $userMorphClass) {
            return;
        }

        $follower = User::query()->find($event->follower_id);
        $followed = User::query()->find($event->followable_id);

        if (
            $follower === null
            || $followed === null
            || $follower->is($followed)
            || $follower->hasBlockRelationshipWith($followed)
        ) {
            return;
        }

        /** @var \Overtrue\LaravelFollow\Followable|null $relation */
        $relation = $follower->followings()->of($followed)->first();

        if ($relation === null) {
            return;
        }

        $acceptedAt = Carbon::make($relation->accepted_at);
        $createdAt = Carbon::make($relation->created_at);

        if ($acceptedAt === null) {
            event(new UserFollowRequested($follower, $followed));

            return;
        }

        $wasPendingRequest = $createdAt !== null && $acceptedAt->gt($createdAt);

        event(new UserFollowAccepted($follower, $followed, $wasPendingRequest));
    }
}

<?php

namespace App\Services;

use App\Events\UserFollowAccepted;
use App\Events\UserUnfollowed;
use App\Models\User;
use App\Notifications\UserFollowRequestedNotification;
use Illuminate\Auth\Access\AuthorizationException;

class UserFollowService
{
    /**
     * Attempt to follow the given user.
     *
     * @return array{pending: bool, accepted: bool}
     *
     * @throws AuthorizationException
     */
    public function follow(User $follower, User $followed): array
    {
        $this->guardInteraction($follower, $followed);

        if ($follower->isFollowing($followed)) {
            return [
                'pending' => false,
                'accepted' => true,
            ];
        }

        if ($follower->hasRequestedToFollow($followed)) {
            return [
                'pending' => true,
                'accepted' => false,
            ];
        }

        $result = $follower->follow($followed);

        $pending = (bool) ($result['pending'] ?? false);

        return [
            'pending' => $pending,
            'accepted' => ! $pending,
        ];
    }

    /**
     * Accept a follow request.
     *
     * @throws AuthorizationException
     */
    public function accept(User $followed, User $follower): void
    {
        $this->guardInteraction($follower, $followed);

        if ($followed->isFollowedBy($follower)) {
            return;
        }

        if (! $follower->hasRequestedToFollow($followed)) {
            return;
        }

        $followed->acceptFollowRequestFrom($follower);

        event(new UserFollowAccepted($follower, $followed, true));
    }

    /**
     * Reject a follow request.
     *
     * @throws AuthorizationException
     */
    public function reject(User $followed, User $follower): void
    {
        $this->guardInteraction($follower, $followed);

        if (! $follower->hasRequestedToFollow($followed)) {
            return;
        }

        $followed->rejectFollowRequestFrom($follower);
    }

    /**
     * Unfollow a user.
     */
    public function unfollow(User $follower, User $followed): void
    {
        $hadAcceptedFollow = $follower->isFollowing($followed);
        $hadPendingRequest = ! $hadAcceptedFollow && $follower->hasRequestedToFollow($followed);

        $follower->unfollow($followed);

        if ($hadPendingRequest) {
            $followed->notifications()
                ->where('type', UserFollowRequestedNotification::TYPE)
                ->whereJsonContains('data->actor->id', $follower->getKey())
                ->delete();
        }

        if ($hadAcceptedFollow) {
            event(new UserUnfollowed($follower, $followed));
        }
    }

    /**
     * Ensure that two users can interact.
     *
     * @throws AuthorizationException
     */
    protected function guardInteraction(User $follower, User $followed): void
    {
        if ($follower->is($followed)) {
            throw new AuthorizationException('Users cannot follow themselves.');
        }

        if ($follower->hasBlockRelationshipWith($followed)) {
            throw new AuthorizationException('Users with an active block relationship cannot follow each other.');
        }
    }
}

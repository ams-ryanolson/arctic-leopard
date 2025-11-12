<?php

namespace App\Policies;

use App\Models\PostPoll;
use App\Models\PostPollVote;
use App\Models\User;
use App\Support\Audience\AudienceDecision;

class PollVotePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(?User $user = null): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(?User $user, PostPollVote $postPollVote): bool
    {
        if ($postPollVote->poll === null) {
            return false;
        }

        return AudienceDecision::make($postPollVote->poll->post, $user)->canView();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->profile_completed_at !== null;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, PostPollVote $postPollVote): bool
    {
        $poll = $postPollVote->poll;

        if ($poll === null) {
            return false;
        }

        if ($user->id === $postPollVote->user_id) {
            return $this->isPollOpen($poll);
        }

        return $user->can('manage polls');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, PostPollVote $postPollVote): bool
    {
        return $user->can('manage polls');
    }

    /**
     * Authorize casting a vote for the given poll.
     */
    public function vote(User $user, PostPoll $poll): bool
    {
        $decision = AudienceDecision::make($poll->post, $user);

        if (! $decision->canView() || $decision->requiresPurchase()) {
            return false;
        }

        if (! $this->isPollOpen($poll)) {
            return false;
        }

        $existingVotes = $poll->votes()
            ->where('user_id', $user->getKey());

        if (! $poll->allow_multiple) {
            return ! $existingVotes->exists();
        }

        if ($poll->max_choices === null) {
            return true;
        }

        return $existingVotes->count() < $poll->max_choices;
    }

    private function isPollOpen(PostPoll $poll): bool
    {
        if ($poll->closes_at === null) {
            return true;
        }

        return $poll->closes_at->isFuture();
    }
}

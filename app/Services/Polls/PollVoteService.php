<?php

namespace App\Services\Polls;

use App\Models\PostPoll;
use App\Models\PostPollOption;
use App\Models\PostPollVote;
use App\Models\User;
use App\Services\Cache\PostCacheService;
use App\Services\Cache\TimelineCacheService;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use LogicException;

class PollVoteService
{
    public function __construct(
        private PostCacheService $postCache,
        private TimelineCacheService $timelineCache,
    ) {}

    /**
     * Cast a vote for the given poll option.
     *
     * @param  array<string, mixed>  $payload
     */
    public function vote(PostPoll $poll, PostPollOption $option, User $user, array $payload = []): PostPollVote
    {
        if ($option->post_poll_id !== $poll->getKey()) {
            throw new InvalidArgumentException('The option does not belong to the provided poll.');
        }

        $vote = DB::transaction(function () use ($poll, $option, $user, $payload): PostPollVote {
            $existingVotesQuery = PostPollVote::query()
                ->where('post_poll_id', $poll->getKey())
                ->where('user_id', $user->getKey())
                ->lockForUpdate();

            $existingVotes = $existingVotesQuery->get();

            if (! $poll->allow_multiple && $existingVotes->isNotEmpty()) {
                throw new LogicException('You have already voted in this poll.');
            }

            if ($poll->allow_multiple && $poll->max_choices !== null && $existingVotes->count() >= $poll->max_choices) {
                throw new LogicException('You have reached the maximum number of selections for this poll.');
            }

            $lockedOption = PostPollOption::query()
                ->whereKey($option->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $vote = PostPollVote::create([
                'post_poll_id' => $poll->getKey(),
                'post_poll_option_id' => $option->getKey(),
                'user_id' => $user->getKey(),
                'ip_address' => $payload['ip_address'] ?? null,
                'meta' => $payload['meta'] ?? [],
            ]);

            $lockedOption->increment('vote_count');
            $poll->post->increment('poll_votes_count');

            return $vote;
        });

        $poll->refresh();
        $poll->loadMissing('post.author');

        if ($poll->post !== null) {
            $this->postCache->forget($poll->post);
            $this->timelineCache->forgetForUsers([
                $poll->post->author,
                $user,
            ]);
            $this->timelineCache->forgetForPost($poll->post);
        }

        return $vote;
    }

    public function retract(PostPollVote $vote, User $user): void
    {
        if ($vote->user_id !== $user->getKey()) {
            throw new LogicException('You may only remove your own votes.');
        }

        $poll = $vote->poll()->with('post.author')->first();

        DB::transaction(function () use ($vote): void {
            $option = $vote->option()->lockForUpdate()->first();

            $vote->delete();

            if ($option !== null && $option->vote_count > 0) {
                $option->decrement('vote_count');
            }

            $poll = $vote->poll()->lockForUpdate()->first();

            if ($poll !== null && $poll->post !== null && $poll->post->poll_votes_count > 0) {
                $poll->post->decrement('poll_votes_count');
            }
        });

        if ($poll !== null) {
            $poll->refresh();
            $poll->loadMissing('post.author');
        }

        if ($poll !== null && $poll->post !== null) {
            $this->postCache->forget($poll->post);
            $this->timelineCache->forgetForUsers([
                $poll->post->author,
                $user,
            ]);
            $this->timelineCache->forgetForPost($poll->post);
        }
    }
}

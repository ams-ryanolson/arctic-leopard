<?php

namespace App\Jobs;

use App\Enums\PostAudience;
use App\Enums\TimelineVisibilitySource;
use App\Events\TimelineEntryBroadcast;
use App\Models\Post;
use App\Models\PostPurchase;
use App\Models\Timeline;
use App\Models\User;
use App\Services\Cache\TimelineCacheService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class RebuildTimelineJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    private const EMPTY_CONTEXT = '[]';

    public int $tries = 3;

    public function __construct(public int $userId) {}

    public function handle(): void
    {
        $user = User::query()->find($this->userId);

        if ($user === null) {
            return;
        }

        Timeline::query()->where('user_id', $user->getKey())->delete();

        $purchasedPostIds = PostPurchase::query()
            ->where('user_id', $user->getKey())
            ->where(function ($query): void {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', Carbon::now());
            })
            ->pluck('post_id')
            ->all();

        $followedCreatorIds = $user->approvedFollowings()
            ->pluck('followable_id')
            ->filter()
            ->map(static fn ($id) => (int) $id)
            ->values()
            ->all();

        $subscribedCreatorIds = $user->subscribedCreators()
            ->pluck('users.id')
            ->filter()
            ->map(static fn ($id) => (int) $id)
            ->values()
            ->all();

        Post::query()
            ->visibleTo($user)
            ->with('author')
            ->where(function ($builder) use ($user, $followedCreatorIds, $subscribedCreatorIds, $purchasedPostIds): void {
                $builder->where('user_id', $user->getKey());

                if ($followedCreatorIds !== []) {
                    $builder->orWhereIn('user_id', $followedCreatorIds);
                }

                if ($subscribedCreatorIds !== []) {
                    $builder->orWhereIn('user_id', $subscribedCreatorIds);
                }

                if ($purchasedPostIds !== []) {
                    $builder->orWhereIn('id', $purchasedPostIds);
                }
            })
            ->latest('published_at')
            ->chunk(200, function (Collection $posts) use ($user, $purchasedPostIds, $followedCreatorIds, $subscribedCreatorIds): void {
                $rows = [];
                $now = Carbon::now();

                $existingPostIds = Timeline::query()
                    ->where('user_id', $user->getKey())
                    ->whereIn('post_id', $posts->pluck('id'))
                    ->pluck('post_id')
                    ->all();

                $newPostIds = [];
                $sourceByPost = [];

                $postsById = $posts->keyBy('id');

                foreach ($posts as $post) {
                    if (in_array($post->getKey(), $existingPostIds, true)) {
                        continue;
                    }

                    $source = $this->determineVisibilitySource(
                        $post,
                        $user,
                        $purchasedPostIds,
                        $followedCreatorIds,
                        $subscribedCreatorIds,
                    );

                    if ($source === null) {
                        continue;
                    }

                    $post->loadMissing('author');

                    $rows[] = [
                        'user_id' => $user->getKey(),
                        'post_id' => $post->getKey(),
                        'visibility_source' => $source->value,
                        'context' => $source === TimelineVisibilitySource::PaywallPurchase
                            ? json_encode([
                                'rebuild' => true,
                                'purchased_at' => $now->toISOString(),
                            ], JSON_THROW_ON_ERROR)
                            : self::EMPTY_CONTEXT,
                        'visible_at' => $post->published_at ?? $now,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];

                    $newPostIds[] = $post->getKey();
                    $sourceByPost[$post->getKey()] = $source->value;
                }

                if ($rows !== []) {
                    Timeline::query()->upsert(
                        $rows,
                        ['user_id', 'post_id'],
                        ['visibility_source', 'context', 'visible_at', 'updated_at']
                    );

                    $entries = Timeline::query()
                        ->where('user_id', $user->getKey())
                        ->whereIn('post_id', $newPostIds)
                        ->get(['id', 'user_id', 'post_id']);

                    foreach ($entries as $entry) {
                        /** @var Post|null $post */
                        $post = $postsById->get($entry->post_id);

                        if ($post === null) {
                            continue;
                        }

                        event(new TimelineEntryBroadcast(
                            $entry->id,
                            $entry->user_id,
                            $post,
                            $sourceByPost[$entry->post_id] ?? TimelineVisibilitySource::SelfAuthored->value,
                        ));
                    }
                }
            });

        app(TimelineCacheService::class)->forgetForUser($user);
    }

    /**
     * @param  array<int, int>  $purchasedPostIds
     * @param  array<int, int>  $followedCreatorIds
     * @param  array<int, int>  $subscribedCreatorIds
     */
    private function determineVisibilitySource(
        Post $post,
        User $user,
        array $purchasedPostIds,
        array $followedCreatorIds,
        array $subscribedCreatorIds,
    ): ?TimelineVisibilitySource {
        if ($post->user_id === $user->getKey()) {
            return TimelineVisibilitySource::SelfAuthored;
        }

        $audience = $post->audience instanceof PostAudience
            ? $post->audience
            : PostAudience::from($post->audience);

        return match ($audience) {
            PostAudience::Followers => in_array($post->user_id, $followedCreatorIds, true)
                ? TimelineVisibilitySource::Following
                : null,
            PostAudience::Subscribers => in_array($post->user_id, $subscribedCreatorIds, true)
                ? TimelineVisibilitySource::Subscription
                : null,
            PostAudience::PayToView => in_array($post->getKey(), $purchasedPostIds, true)
                ? TimelineVisibilitySource::PaywallPurchase
                : null,
            PostAudience::Public => in_array($post->user_id, $followedCreatorIds, true)
                ? TimelineVisibilitySource::Following
                : (in_array($post->user_id, $subscribedCreatorIds, true)
                    ? TimelineVisibilitySource::Subscription
                    : null),
            default => null,
        };
    }
}

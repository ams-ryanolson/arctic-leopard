<?php

namespace App\Jobs;

use App\Enums\PostAudience;
use App\Enums\TimelineVisibilitySource;
use App\Enums\Payments\PaymentSubscriptionStatus;
use App\Events\TimelineEntryBroadcast;
use App\Models\Post;
use App\Models\Timeline;
use App\Models\User;
use App\Models\Payments\PaymentSubscription;
use App\Services\Cache\TimelineCacheService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class TimelineFanOutJob implements ShouldQueue
{
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    private const EMPTY_CONTEXT = '[]';

    public int $tries = 3;

    public function __construct(public int $postId)
    {
    }

    public function handle(): void
    {
        $post = Post::query()
            ->with('author')
            ->find($this->postId);

        if ($post === null) {
            return;
        }

        if ($post->published_at !== null && $post->published_at->isFuture()) {
            // Re-dispatch closer to publish time.
            self::dispatch($post->getKey())->delay($post->published_at);

            return;
        }

        $author = $post->author;

        if ($author === null) {
            return;
        }

        $audience = $post->audience instanceof PostAudience
            ? $post->audience
            : PostAudience::from($post->audience);

        if ($post->is_system) {
            return;
        }

        $shouldDeliverToFollowers = in_array($audience, [PostAudience::Public, PostAudience::Followers], true);

        if ($shouldDeliverToFollowers) {
            $author->approvedFollowers()
                ->select('users.id')
                ->chunk(500, function (Collection $followers) use ($post): void {
                    $this->fanOutToUsers(
                        $post,
                        $followers->pluck('id')->all(),
                        TimelineVisibilitySource::Following,
                    );
                });
        }

        if ($audience === PostAudience::Subscribers) {
            PaymentSubscription::query()
                ->select('subscriber_id')
                ->where('creator_id', $author->getKey())
                ->whereIn('status', [
                    PaymentSubscriptionStatus::Active->value,
                    PaymentSubscriptionStatus::Trialing->value,
                    PaymentSubscriptionStatus::Grace->value,
                ])
                ->where(function ($query): void {
                    $query->whereNull('ends_at')
                        ->orWhere('ends_at', '>', Carbon::now());
                })
                ->where(function ($query): void {
                    $query->whereNull('grace_ends_at')
                        ->orWhere('grace_ends_at', '>', Carbon::now());
                })
                ->chunkById(500, function (Collection $subscriptions) use ($post): void {
                    $this->fanOutToUsers(
                        $post,
                        $subscriptions->pluck('subscriber_id')->all(),
                        TimelineVisibilitySource::Subscription,
                    );
                });
        }
    }

    /**
     * @param  array<int, int>  $userIds
     */
    private function fanOutToUsers(Post $post, array $userIds, TimelineVisibilitySource $source): void
    {
        if ($userIds === []) {
            return;
        }

        $existingUserIds = Timeline::query()
            ->where('post_id', $post->getKey())
            ->whereIn('user_id', $userIds)
            ->pluck('user_id')
            ->all();

        $newUserIds = array_values(array_diff($userIds, $existingUserIds));

        if ($newUserIds === []) {
            return;
        }

        $now = Carbon::now();

        $rows = collect($newUserIds)->map(static function (int $userId) use ($post, $source, $now): array {
            return [
                'user_id' => $userId,
                'post_id' => $post->getKey(),
                'visibility_source' => $source->value,
                'context' => self::EMPTY_CONTEXT,
                'visible_at' => $post->published_at ?? $now,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        })->all();

        try {
            Timeline::query()->upsert(
                $rows,
                ['user_id', 'post_id'],
                ['visibility_source', 'context', 'visible_at', 'updated_at']
            );
        } catch (\Throwable $exception) {
            Log::error('Failed to fan out timeline entries', [
                'post_id' => $post->getKey(),
                'user_ids' => $newUserIds,
                'error' => $exception->getMessage(),
            ]);

            throw $exception;
        }

        $entries = Timeline::query()
            ->where('post_id', $post->getKey())
            ->whereIn('user_id', $newUserIds)
            ->get(['id', 'user_id']);

        $post->loadMissing('author');

        foreach ($entries as $entry) {
            event(new TimelineEntryBroadcast(
                $entry->id,
                $entry->user_id,
                $post,
                $source->value,
            ));
        }

        app(TimelineCacheService::class)->forgetForUsers($newUserIds);
    }
}

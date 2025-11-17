<?php

namespace App\Services\Posts;

use App\Enums\PostAudience;
use App\Enums\PostType;
use App\Enums\TimelineVisibilitySource;
use App\Events\PostPublished;
use App\Models\Hashtag;
use App\Models\Post;
use App\Models\PostPoll;
use App\Models\PostPollOption;
use App\Models\Timeline;
use App\Models\User;
use App\Services\Cache\PostCacheService;
use App\Services\Cache\TimelineCacheService;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PostCreationService
{
    public function __construct(
        private TimelineCacheService $timelineCache,
        private PostCacheService $postCache,
        private PostMediaService $postMediaService,
    ) {}

    /**
     * @param  array<int, array<string, mixed>>  $media
     * @param  array<string, mixed>|null  $pollData
     * @param  array<int, string>  $hashtags
     */
    public function create(
        User $author,
        array $attributes,
        array $media = [],
        ?array $pollData = null,
        array $hashtags = [],
    ): Post {
        [$post, $shouldDispatchPublishedEvent] = DB::transaction(function () use (
            $author,
            $attributes,
            $media,
            $pollData,
            $hashtags,
        ): array {
            $post = new Post(Arr::except($attributes, ['user_id', 'media', 'poll', 'hashtags', 'post_to_circles']));
            $post->author()->associate($author);

            if (! isset($post->type)) {
                $post->type = PostType::Text;
            }

            if (! isset($post->audience)) {
                $post->audience = PostAudience::Public;
            }

            if (! $post->published_at && $post->scheduled_at) {
                $post->published_at = Carbon::parse($post->scheduled_at);
            }

            if (! $post->published_at && empty($post->scheduled_at)) {
                $post->published_at = Carbon::now();
            }

            $post->save();

            $this->createAuthorTimelineEntry($post);
            $this->syncHashtags($post, $hashtags);
            $this->postMediaService->attachFromTemporary($post, $media);

            if ($pollData !== null) {
                $this->storePoll($post, $pollData);
            }

            return [$post, $this->shouldDispatchPublishedEvent($post)];
        });

        $post->refresh();

        if ($shouldDispatchPublishedEvent) {
            PostPublished::dispatch($post, $post->scheduled_at !== null);
        }

        $this->postCache->forget($post);

        $recipients = [$author];

        if (method_exists($author, 'approvedFollowers')) {
            $recipients = array_merge(
                $recipients,
                $author->approvedFollowers()
                    ->pluck('users.id')
                    ->filter()
                    ->map(static fn ($id) => (int) $id)
                    ->all(),
            );
        }

        if (method_exists($author, 'subscribers')) {
            $recipients = array_merge(
                $recipients,
                $author->subscribers()
                    ->pluck('users.id')
                    ->filter()
                    ->map(static fn ($id) => (int) $id)
                    ->all(),
            );
        }

        $this->timelineCache->forgetForUsers($recipients);
        $this->timelineCache->forgetForPost($post);

        if (! empty($attributes['post_to_circles'])) {
            $this->attachPostToAuthorCircles($post, $author);
        }

        return $post;
    }

    /**
     * @param  array<int, string>  $rawHashtags
     */
    public function syncHashtags(Post $post, array $rawHashtags, bool $replace = false): void
    {
        if ($rawHashtags === []) {
            if ($replace) {
                $this->detachHashtags($post);
            }

            return;
        }

        $normalized = collect($rawHashtags)
            ->map(fn (string $tag) => Str::of($tag)->replace('#', '')->trim()->lower())
            ->filter()
            ->unique()
            ->values();

        if ($normalized->isEmpty()) {
            return;
        }

        $existingIds = $post->hashtags()->pluck('hashtags.id')->all();
        $pivotData = [];

        $normalized->each(function (string $tag, int $index) use (&$pivotData): void {
            $name = Str::of($tag)->replace('-', ' ')->title()->toString();
            $slug = Str::slug($name);

            $hashtag = Hashtag::query()->where('slug', $slug)->first();

            if ($hashtag === null) {
                $hashtag = Hashtag::create([
                    'name' => $name,
                    'slug' => $slug,
                ]);
            }

            $pivotData[$hashtag->getKey()] = [
                'position' => $index,
                'created_at' => now(),
                'updated_at' => now(),
            ];

        });

        $newIds = array_keys($pivotData);

        if ($replace) {
            $post->hashtags()->sync($pivotData);

            $removed = array_diff($existingIds, $newIds);

            if ($removed !== []) {
                Hashtag::query()
                    ->whereIn('id', $removed)
                    ->where('usage_count', '>', 0)
                    ->decrement('usage_count');
            }
        } else {
            $post->hashtags()->syncWithoutDetaching($pivotData);
        }

        $added = array_diff($newIds, $existingIds);

        if ($added !== []) {
            Hashtag::query()
                ->whereIn('id', $added)
                ->increment('usage_count');
        }

        $this->detachUnusedHashtags();
    }

    protected function attachPostToAuthorCircles(Post $post, User $author): void
    {
        $circleIds = $author->circles()->pluck('circles.id')->all();

        if ($circleIds === []) {
            return;
        }

        $pivotPayload = collect($circleIds)
            ->values()
            ->mapWithKeys(fn (int $id, int $index) => [
                $id => [
                    'is_primary' => $index === 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ])
            ->all();

        $post->circles()->syncWithoutDetaching($pivotPayload);

        $this->timelineCache->forgetForCircles($circleIds);
    }

    /**
     * @param  array<string, mixed>  $pollData
     */
    public function storePoll(Post $post, array $pollData): void
    {
        $options = collect($pollData['options'] ?? [])
            ->filter(fn (string $option) => Str::of($option)->trim()->isNotEmpty())
            ->values();

        if ($options->isEmpty()) {
            return;
        }

        /** @var PostPoll $poll */
        $poll = $post->poll()->create([
            'question' => $pollData['question'],
            'allow_multiple' => (bool) ($pollData['allow_multiple'] ?? false),
            'max_choices' => $pollData['max_choices'] ?? null,
            'closes_at' => isset($pollData['closes_at']) ? Carbon::parse($pollData['closes_at']) : null,
            'meta' => $pollData['meta'] ?? [],
        ]);

        $optionPayloads = $options->map(fn (string $title, int $index) => [
            'post_poll_id' => $poll->getKey(),
            'title' => $title,
            'position' => $index,
            'vote_count' => 0,
            'meta' => json_encode([], JSON_THROW_ON_ERROR),
            'created_at' => now(),
            'updated_at' => now(),
        ])->all();

        PostPollOption::query()->insert($optionPayloads);
    }

    protected function shouldDispatchPublishedEvent(Post $post): bool
    {
        if ($post->is_system) {
            return true;
        }

        if ($post->published_at === null) {
            return false;
        }

        return $post->published_at->isPast();
    }

    protected function createAuthorTimelineEntry(Post $post): void
    {
        Timeline::query()->upsert([
            [
                'user_id' => $post->user_id,
                'post_id' => $post->getKey(),
                'visibility_source' => TimelineVisibilitySource::SelfAuthored->value,
                'context' => json_encode([]),
                'visible_at' => $post->published_at ?? now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ], ['user_id', 'post_id'], ['visibility_source', 'context', 'visible_at', 'updated_at']);
    }

    protected function detachHashtags(Post $post): void
    {
        $ids = $post->hashtags()->pluck('hashtags.id')->all();

        if ($ids === []) {
            return;
        }

        $post->hashtags()->detach();

        Hashtag::query()
            ->whereIn('id', $ids)
            ->where('usage_count', '>', 0)
            ->decrement('usage_count');
    }

    protected function detachUnusedHashtags(): void
    {
        Hashtag::query()->where('usage_count', '<', 0)->update(['usage_count' => 0]);
    }
}

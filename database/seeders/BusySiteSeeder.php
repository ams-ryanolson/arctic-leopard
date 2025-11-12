<?php

namespace Database\Seeders;

use App\Enums\PostAudience;
use App\Enums\PostType;
use App\Enums\TimelineVisibilitySource;
use App\Models\Hashtag;
use App\Models\Interest;
use App\Models\Post;
use App\Models\PostMedia;
use App\Models\PostPoll;
use App\Models\PostPollOption;
use App\Models\PostPollVote;
use App\Models\PostPurchase;
use App\Models\Timeline;
use App\Models\User;
use Database\Seeders\Concerns\DownloadsUnsplashMedia;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Enums\Payments\PaymentSubscriptionStatus;
use App\Models\Payments\PaymentMethod;
use App\Models\Payments\PaymentSubscription;
use App\Models\Payments\SubscriptionPlan;

class BusySiteSeeder extends Seeder
{
    use DownloadsUnsplashMedia;

    protected int $creatorCount = 60;
    protected int $viewerCount = 40;
    protected int $postTarget = 500;

    /**
     * Topics used when fetching Unsplash imagery.
     *
     * @var list<string>
     */
    protected array $mediaTopics = [
        'kink',
        'fetish',
        'bondage',
        'leather',
        'rope',
        'latex',
    ];

    /**
     * Cached hashtag ids used when attaching to posts.
     *
     * @var array<int, int>
     */
    protected array $hashtagIds = [];

    /**
     * Cached interest ids used when attaching to users.
     *
     * @var array<int, int>
     */
    protected array $interestIds = [];

    /**
     * Indexed user collection for quick lookups.
     *
     * @var array<int, User>
     */
    protected array $userIndex = [];

    /**
     * Cached follower user ids keyed by creator id.
     *
     * @var array<int, array<int>>
     */
    protected array $creatorFollowerMap = [];

    /**
     * Cached subscriber user ids keyed by creator id.
     *
     * @var array<int, array<int>>
     */
    protected array $creatorSubscriberMap = [];

    /**
     * Cached subscription plans keyed by creator id.
     *
     * @var array<int, SubscriptionPlan>
     */
    protected array $creatorSubscriptionPlans = [];

    /**
     * Cached payment methods keyed by subscriber id.
     *
     * @var array<int, PaymentMethod>
     */
    protected array $subscriberPaymentMethods = [];

    public function run(): void
    {
        $this->hashtagIds = Hashtag::query()->pluck('id')->all();
        $this->interestIds = Interest::query()->pluck('id')->all();

        $creators = $this->createCreators();
        $viewers = $this->createViewers();

        $this->indexUsers($creators, $viewers);

        $this->seedFollowGraph($creators, $viewers);
        $this->seedSubscriptions($creators, $viewers);

        $posts = $this->seedPosts($creators, $viewers);

        $purchaseMap = $this->seedPaywallPurchases($posts, $viewers);

        $this->seedPollVotes($posts, $viewers);

        $this->seedTimelines($posts, $purchaseMap);
    }

    /**
     * @return EloquentCollection<int, User>
     */
    protected function createCreators(): EloquentCollection
    {
        $creators = User::factory()
            ->count($this->creatorCount)
            ->create();

        $creators->each(function (User $user): void {
            $this->assignProfileMedia($user);
            $this->attachRandomInterests($user, fake()->numberBetween(3, 6));
            $this->ensureCreatorPlan($user);
        });

        return $creators;
    }

    /**
     * @return EloquentCollection<int, User>
     */
    protected function createViewers(): EloquentCollection
    {
        $viewers = User::factory()
            ->count($this->viewerCount)
            ->create();

        $viewers->each(function (User $user): void {
            if (fake()->boolean(60)) {
                $this->assignProfileMedia($user, true);
            }

            $this->attachRandomInterests($user, fake()->numberBetween(1, 4));
        });

        return $viewers;
    }

    protected function assignProfileMedia(User $user, bool $coverOnly = false): void
    {
        if (! $coverOnly) {
            $avatar = $this->fetchSeedImage(['portrait', 'leather'], '512x512');

            if ($avatar !== null) {
                $user->forceFill(['avatar_path' => $avatar['path']])->save();
            }
        }

        $cover = $this->fetchSeedImage(['studio', 'spotlight', 'rope'], '1600x900');

        if ($cover !== null) {
            $user->forceFill(['cover_path' => $cover['path']])->save();
        }
    }

    protected function attachRandomInterests(User $user, int $count): void
    {
        if ($this->interestIds === []) {
            return;
        }

        $count = min($count, count($this->interestIds));

        $ids = Arr::wrap(fake()->randomElements($this->interestIds, $count));

        $user->interests()->sync($ids);
    }

    protected function ensureCreatorPlan(User $creator): SubscriptionPlan
    {
        $creatorId = $creator->getKey();

        if (isset($this->creatorSubscriptionPlans[$creatorId])) {
            return $this->creatorSubscriptionPlans[$creatorId];
        }

        $plan = SubscriptionPlan::factory()
            ->for($creator, 'creator')
            ->state([
                'interval' => 'monthly',
                'interval_count' => 1,
                'is_active' => true,
                'is_public' => true,
            ])
            ->create();

        return $this->creatorSubscriptionPlans[$creatorId] = $plan;
    }

    protected function ensureSubscriberPaymentMethod(User $subscriber): PaymentMethod
    {
        $subscriberId = $subscriber->getKey();

        if (isset($this->subscriberPaymentMethods[$subscriberId])) {
            return $this->subscriberPaymentMethods[$subscriberId];
        }

        $method = PaymentMethod::factory()
            ->for($subscriber, 'user')
            ->state([
                'provider' => 'fake',
                'type' => 'card',
                'is_default' => true,
            ])
            ->create();

        return $this->subscriberPaymentMethods[$subscriberId] = $method;
    }

    protected function indexUsers(EloquentCollection $creators, EloquentCollection $viewers): void
    {
        $this->userIndex = $creators->concat($viewers)
            ->keyBy(fn (User $user) => $user->getKey())
            ->all();
    }

    protected function seedFollowGraph(EloquentCollection $creators, EloquentCollection $viewers): void
    {
        if ($creators->isEmpty()) {
            return;
        }

        $creatorPool = $creators->values();

        $viewers->each(function (User $viewer) use ($creatorPool): void {
            $followCount = fake()->numberBetween(5, min(20, $creatorPool->count()));
            $targets = $creatorPool->random($followCount);

            foreach ($this->normalizeSelection($targets) as $target) {
                DB::transaction(fn () => $viewer->follow($target));
            }
        });

        $creators->each(function (User $creator) use ($creatorPool): void {
            $others = $creatorPool->reject(fn (User $candidate) => $candidate->is($creator))->values();

            if ($others->isEmpty()) {
                return;
            }

            $followCount = fake()->numberBetween(3, min(10, $others->count()));
            $targets = $others->random($followCount);

            foreach ($this->normalizeSelection($targets) as $target) {
                DB::transaction(fn () => $creator->follow($target));
            }
        });

        $this->creatorFollowerMap = $creators
            ->mapWithKeys(function (User $creator) {
                $ids = $creator->approvedFollowers()->pluck('users.id')->all();

                return [$creator->getKey() => $ids];
            })
            ->all();
    }

    protected function seedSubscriptions(EloquentCollection $creators, EloquentCollection $viewers): void
    {
        if ($creators->isEmpty()) {
            return;
        }

        $creatorPool = $creators->values();
        $viewerPool = $viewers->values();

        $viewerPool->each(function (User $viewer) use ($creatorPool): void {
            if (! fake()->boolean(55)) {
                return;
            }

            $count = fake()->numberBetween(1, min(6, $creatorPool->count()));
            $targets = $creatorPool->random($count);

            foreach ($this->normalizeSelection($targets) as $target) {
                /** @var User $target */
                if ($viewer->is($target)) {
                    continue;
                }

                DB::transaction(function () use ($viewer, $target): void {
                    $plan = $this->ensureCreatorPlan($target);
                    $method = $this->ensureSubscriberPaymentMethod($viewer);

                    PaymentSubscription::query()->updateOrCreate(
                        [
                            'subscriber_id' => $viewer->getKey(),
                            'creator_id' => $target->getKey(),
                            'subscription_plan_id' => $plan->getKey(),
                        ],
                        [
                            'payment_method_id' => $method->getKey(),
                            'status' => PaymentSubscriptionStatus::Active,
                            'provider' => 'fake',
                            'provider_subscription_id' => (string) Str::uuid(),
                            'auto_renews' => true,
                            'amount' => $plan->amount,
                            'currency' => $plan->currency,
                            'interval' => $plan->interval,
                            'interval_count' => $plan->interval_count,
                            'starts_at' => now()->subDays(fake()->numberBetween(1, 45)),
                            'ends_at' => now()->addMonths(fake()->numberBetween(1, 3)),
                            'grace_ends_at' => null,
                            'trial_ends_at' => null,
                            'cancelled_at' => null,
                            'cancellation_reason' => null,
                            'metadata' => ['seeded' => true],
                        ]
                    );
                });
            }
        });

        $creators->each(function (User $creator) use ($creatorPool): void {
            if (! fake()->boolean(35)) {
                return;
            }

            $others = $creatorPool->reject(fn (User $candidate) => $candidate->is($creator))->values();

            if ($others->isEmpty()) {
                return;
            }

            $count = fake()->numberBetween(1, min(4, $others->count()));
            $targets = $others->random($count);

            foreach ($this->normalizeSelection($targets) as $target) {
                /** @var User $target */
                DB::transaction(function () use ($creator, $target): void {
                    $plan = $this->ensureCreatorPlan($target);
                    $method = $this->ensureSubscriberPaymentMethod($creator);

                    PaymentSubscription::query()->updateOrCreate(
                        [
                            'subscriber_id' => $creator->getKey(),
                            'creator_id' => $target->getKey(),
                            'subscription_plan_id' => $plan->getKey(),
                        ],
                        [
                            'payment_method_id' => $method->getKey(),
                            'status' => PaymentSubscriptionStatus::Active,
                            'provider' => 'fake',
                            'provider_subscription_id' => (string) Str::uuid(),
                            'auto_renews' => true,
                            'amount' => $plan->amount,
                            'currency' => $plan->currency,
                            'interval' => $plan->interval,
                            'interval_count' => $plan->interval_count,
                            'starts_at' => now()->subDays(fake()->numberBetween(1, 45)),
                            'ends_at' => now()->addMonths(fake()->numberBetween(1, 3)),
                            'grace_ends_at' => null,
                            'trial_ends_at' => null,
                            'cancelled_at' => null,
                            'cancellation_reason' => null,
                            'metadata' => ['seeded' => true],
                        ]
                    );
                });
            }
        });

        $this->creatorSubscriberMap = $creators
            ->mapWithKeys(function (User $creator) {
                $ids = $creator->subscribers()->pluck('users.id')->all();

                return [$creator->getKey() => $ids];
            })
            ->all();
    }

    /**
     * @return Collection<int, Post>
     */
    protected function seedPosts(EloquentCollection $creators, EloquentCollection $viewers): Collection
    {
        $posts = collect();

        if ($creators->isEmpty()) {
            return $posts;
        }

        $creatorCount = $creators->count();

        for ($index = 0; $index < $this->postTarget; $index++) {
            /** @var User $creator */
            $creator = $creators[$index % $creatorCount];

            $posts->push($this->createPostForCreator($creator, $viewers));
        }

        return $posts;
    }

    protected function createPostForCreator(User $creator, EloquentCollection $viewers): Post
    {
        $type = $this->randomPostType();

        return match ($type) {
            PostType::Text->value => $this->createTextPost($creator),
            PostType::Media->value => $this->createMediaPost($creator),
            PostType::Poll->value => $this->createPollPost($creator, $viewers),
            'paywall' => $this->createPaywalledPost($creator),
            default => $this->createTextPost($creator),
        };
    }

    protected function randomPostType(): string
    {
        $roll = fake()->numberBetween(1, 100);

        return match (true) {
            $roll <= 45 => PostType::Media->value,
            $roll <= 75 => PostType::Text->value,
            $roll <= 85 => PostType::Poll->value,
            default => 'paywall',
        };
    }

    protected function createTextPost(User $creator): Post
    {
        $post = Post::factory()
            ->for($creator, 'author')
            ->text()
            ->publishedWithinLastDays(60)
            ->audience($this->randomAudience([PostAudience::Public, PostAudience::Followers]))
            ->create([
                'body' => implode("\n\n", fake()->paragraphs(fake()->numberBetween(1, 3))),
            ]);

        $this->attachHashtags($post);

        return $post;
    }

    protected function createMediaPost(User $creator): Post
    {
        $audience = $this->randomAudience([
            PostAudience::Public,
            PostAudience::Followers,
            PostAudience::Subscribers,
        ]);

        $post = Post::factory()
            ->for($creator, 'author')
            ->media()
            ->publishedWithinLastDays(45)
            ->audience($audience)
            ->create([
                'body' => fake()->sentence(fake()->numberBetween(6, 16)),
            ]);

        $mediaCount = fake()->numberBetween(1, 4);

        $this->attachMedia($post, $mediaCount);
        $this->attachHashtags($post);

        return $post;
    }

    protected function createPollPost(User $creator, EloquentCollection $viewers): Post
    {
        $post = Post::factory()
            ->for($creator, 'author')
            ->poll()
            ->publishedWithinLastDays(30)
            ->audience(PostAudience::Subscribers)
            ->create([
                'body' => fake()->sentence(fake()->numberBetween(8, 14)),
            ]);

        $allowMultiple = fake()->boolean(35);

        $poll = PostPoll::factory()
            ->for($post)
            ->create([
                'question' => fake()->sentence(fake()->numberBetween(6, 12)),
                'allow_multiple' => $allowMultiple,
                'max_choices' => $allowMultiple ? fake()->numberBetween(2, 4) : null,
            ]);

        $optionCount = fake()->numberBetween(2, 5);
        $options = collect();

        for ($index = 0; $index < $optionCount; $index++) {
            $options->push(
                PostPollOption::factory()
                    ->for($poll, 'poll')
                    ->create([
                        'title' => ucfirst(fake()->words(fake()->numberBetween(2, 4), true)),
                        'position' => $index,
                    ])
            );
        }

        $this->attachHashtags($post);

        if ($viewers->isEmpty()) {
            return $post;
        }

        $voters = $viewers->random(min($viewers->count(), fake()->numberBetween(5, 20)));
        $options = $options->all();

        foreach ($this->normalizeSelection($voters) as $voter) {
            /** @var User $voter */
            $option = Arr::random($options);

            PostPollVote::factory()
                ->for($option, 'option')
                ->for($voter, 'user')
                ->state(['post_poll_id' => $poll->getKey()])
                ->create();
        }

        return $post;
    }

    protected function createPaywalledPost(User $creator): Post
    {
        $post = Post::factory()
            ->for($creator, 'author')
            ->media()
            ->payToView()
            ->publishedWithinLastDays(30)
            ->create([
                'body' => implode("\n\n", fake()->paragraphs(fake()->numberBetween(1, 2))),
            ]);

        $this->attachMedia($post, fake()->numberBetween(1, 3));
        $this->attachHashtags($post);

        return $post;
    }

    protected function attachHashtags(Post $post): void
    {
        if ($this->hashtagIds === []) {
            return;
        }

        $count = fake()->numberBetween(1, min(4, count($this->hashtagIds)));
        $ids = Arr::wrap(fake()->randomElements($this->hashtagIds, $count));

        $post->hashtags()->syncWithoutDetaching($ids);
    }

    protected function attachMedia(Post $post, int $count): void
    {
        for ($index = 0; $index < $count; $index++) {
            $seedMedia = $this->fetchSeedImage($this->mediaTopics);

            if ($seedMedia === null) {
                continue;
            }

            PostMedia::factory()
                ->image()
                ->for($post)
                ->state(array_merge($seedMedia, [
                    'position' => $index,
                    'is_primary' => $index === 0,
                ]))
                ->create();
        }
    }

    protected function randomAudience(array $choices): PostAudience
    {
        /** @var PostAudience $audience */
        $audience = Arr::random($choices);

        return $audience;
    }

    /**
     * @param  Collection<int, Post>  $posts
     * @return array<int, array<int>>
     */
    protected function seedPaywallPurchases(Collection $posts, EloquentCollection $viewers): array
    {
        $purchases = [];

        if ($viewers->isEmpty()) {
            return $purchases;
        }

        $paywallPosts = $posts->filter(fn (Post $post) => $post->audience === PostAudience::PayToView);

        $paywallPosts->each(function (Post $post) use ($viewers, &$purchases): void {
            if (! fake()->boolean(80)) {
                return;
            }

            $buyers = $viewers->random(min($viewers->count(), fake()->numberBetween(3, 12)));

            foreach ($this->normalizeSelection($buyers) as $buyer) {
                /** @var User $buyer */
                PostPurchase::factory()
                    ->for($post)
                    ->for($buyer)
                    ->state([
                        'amount' => $post->paywall_price ?? fake()->numberBetween(500, 2500),
                        'currency' => $post->paywall_currency ?? 'USD',
                        'status' => 'completed',
                    ])
                    ->create();

                $purchases[$post->getKey()][] = $buyer->getKey();
            }
        });

        return $purchases;
    }

    /**
     * @param  Collection<int, Post>  $posts
     */
    protected function seedPollVotes(Collection $posts, EloquentCollection $viewers): void
    {
        if ($viewers->isEmpty()) {
            return;
        }

        $posts->filter(fn (Post $post) => $post->type === PostType::Poll)
            ->each(function (Post $post) use ($viewers): void {
                $poll = $post->poll;

                if ($poll === null) {
                    return;
                }

                $options = $poll->options()->get();

                if ($options->isEmpty()) {
                    return;
                }

                $voters = $viewers->random(min($viewers->count(), fake()->numberBetween(6, 20)));

                $voterSelection = collect($this->normalizeSelection($voters))
                    ->unique(fn (User $user) => $user->getKey());

                $voterSelection->each(function (User $voter) use ($poll, $options): void {
                    $option = Arr::random($options);

                    PostPollVote::query()->updateOrCreate(
                        [
                            'post_poll_id' => $poll->getKey(),
                            'user_id' => $voter->getKey(),
                        ],
                        [
                            'post_poll_option_id' => $option->getKey(),
                            'ip_address' => fake()->ipv4(),
                            'meta' => [],
                        ]
                    );
                });
            });
    }

    /**
     * @param  Collection<int, Post>  $posts
     * @param  array<int, array<int>>  $purchaseMap
     */
    protected function seedTimelines(Collection $posts, array $purchaseMap): void
    {
        $posts->each(function (Post $post) use ($purchaseMap): void {
            $authorId = $post->user_id;

            if (! is_int($authorId)) {
                return;
            }

            $publishedAt = $post->published_at ?? now();

            $this->createTimelineEntry($authorId, $post, TimelineVisibilitySource::SelfAuthored, $publishedAt);

            $followers = $this->creatorFollowerMap[$authorId] ?? [];
            $subscribers = $this->creatorSubscriberMap[$authorId] ?? [];

            if (in_array($post->audience, [PostAudience::Public, PostAudience::Followers], true)) {
                foreach ($followers as $followerId) {
                    $this->createTimelineEntry($followerId, $post, TimelineVisibilitySource::Following, $publishedAt);
                }
            }

            if ($post->audience === PostAudience::Subscribers) {
                foreach ($subscribers as $subscriberId) {
                    $this->createTimelineEntry($subscriberId, $post, TimelineVisibilitySource::Subscription, $publishedAt);
                }
            }

            if ($post->audience === PostAudience::Public && $subscribers !== []) {
                $subscriberOnly = array_diff($subscribers, $followers);

                foreach ($subscriberOnly as $subscriberId) {
                    $this->createTimelineEntry($subscriberId, $post, TimelineVisibilitySource::Subscription, $publishedAt);
                }
            }

            if ($post->audience === PostAudience::PayToView) {
                $buyers = $purchaseMap[$post->getKey()] ?? [];

                foreach ($buyers as $buyerId) {
                    $this->createTimelineEntry($buyerId, $post, TimelineVisibilitySource::PaywallPurchase, $publishedAt);
                }
            }
        });
    }

    /**
     * @return array<int, mixed>
     */
    protected function normalizeSelection(mixed $selection): array
    {
        if ($selection instanceof Collection) {
            return $selection->all();
        }

        return Arr::wrap($selection);
    }

    protected function createTimelineEntry(int $userId, Post $post, TimelineVisibilitySource $source, mixed $visibleAt): void
    {
        if (! isset($this->userIndex[$userId])) {
            return;
        }

        Timeline::query()->updateOrCreate(
            [
                'user_id' => $userId,
                'post_id' => $post->getKey(),
            ],
            [
                'visibility_source' => $source->value,
                'context' => [],
                'visible_at' => $visibleAt,
            ]
        );
    }
}


<?php

namespace App\Services\Posts;

use App\Enums\PostAudience;
use App\Enums\TimelineVisibilitySource;
use App\Events\PostPurchased;
use App\Services\Cache\PostCacheService;
use App\Services\Cache\TimelineCacheService;
use App\Services\Payments\PaymentService;
use App\Payments\Data\PaymentIntentData;
use App\Enums\Payments\PaymentType;
use App\Enums\Payments\PostPurchaseStatus;
use App\ValueObjects\Money;
use App\Models\Post;
use App\Models\PostPurchase;
use App\Models\Timeline;
use App\Models\User;
use App\Support\Audience\AudienceDecision;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PostLockService
{
    public function __construct(
        private TimelineCacheService $timelineCache,
        private PostCacheService $postCache,
        private PaymentService $payments,
    ) {
    }

    public function hasAccess(Post $post, ?User $viewer): bool
    {
        return AudienceDecision::make($post, $viewer)->canView();
    }

    public function requiresPurchase(Post $post, ?User $viewer): bool
    {
        return AudienceDecision::make($post, $viewer)->requiresPurchase();
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    public function purchase(User $buyer, Post $post, int $amount, string $currency, array $meta = [], ?Carbon $expiresAt = null): array
    {
        if ($post->audience instanceof PostAudience && $post->audience !== PostAudience::PayToView) {
            throw new InvalidArgumentException('Only pay-to-view posts may be purchased.');
        }

        if ($buyer->getKey() === $post->user_id) {
            throw new InvalidArgumentException('Creators cannot purchase their own content.');
        }

        $money = Money::from($amount, strtoupper($currency));

        /** @var array{purchase: PostPurchase, intent: \App\Models\Payments\PaymentIntent} $result */
        $result = DB::transaction(function () use ($buyer, $post, $money, $meta, $expiresAt) {
            $purchase = PostPurchase::query()->create([
                'post_id' => $post->getKey(),
                'user_id' => $buyer->getKey(),
                'amount' => $money->amount(),
                'currency' => $money->currency(),
                'status' => PostPurchaseStatus::Pending,
                'expires_at' => $expiresAt,
                'metadata' => $meta['details'] ?? [],
            ]);

            $intent = $this->payments->createIntent(
                new PaymentIntentData(
                    payableType: PostPurchase::class,
                    payableId: $purchase->getKey(),
                    amount: $money,
                    payerId: $buyer->getKey(),
                    payeeId: $post->user_id,
                    type: PaymentType::OneTime,
                    method: $meta['method'] ?? null,
                    metadata: $meta['details'] ?? [],
                    description: "Unlock post {$post->getKey()}"
                ),
                $meta['gateway'] ?? null
            );

            $purchase->payment_id = $intent->payment_id;
            $purchase->save();

            return [
                'purchase' => $purchase->fresh(),
                'intent' => $intent,
            ];
        });

        return [$result['purchase'], $result['intent']];
    }

    public function completePurchase(PostPurchase $purchase): void
    {
        $post = $purchase->post()->first();
        $buyer = $purchase->user()->first();

        if ($post === null || $buyer === null) {
            return;
        }

        Timeline::query()->upsert([
            [
                'user_id' => $buyer->getKey(),
                'post_id' => $post->getKey(),
                'visibility_source' => TimelineVisibilitySource::PaywallPurchase->value,
                'context' => json_encode([
                    'purchased_at' => Carbon::now()->toISOString(),
                ], JSON_THROW_ON_ERROR),
                'visible_at' => Carbon::now(),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ], ['user_id', 'post_id'], ['visibility_source', 'context', 'visible_at', 'updated_at']);

        PostPurchased::dispatch($purchase);

        $post->loadMissing('author');

        $this->timelineCache->forgetForUsers([
            $buyer,
            $post->author,
        ]);
        $this->timelineCache->forgetForPost($post);
        $this->postCache->forget($post);
    }
}


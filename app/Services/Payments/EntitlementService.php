<?php

namespace App\Services\Payments;

use App\Enums\Payments\PaymentSubscriptionStatus;
use App\Enums\Payments\PostPurchaseStatus;
use App\Models\Post;
use App\Models\PostPurchase;
use App\Models\Payments\PaymentSubscription;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class EntitlementService
{
    /**
     * Determine if the subscriber has an active subscription to the creator.
     */
    public function hasActiveSubscription(User $subscriber, User $creator): bool
    {
        return $this->queryActiveSubscriptions($subscriber, $creator)->exists();
    }

    /**
     * Retrieve the active subscription, if any.
     */
    public function activeSubscription(User $subscriber, User $creator): ?PaymentSubscription
    {
        return $this->queryActiveSubscriptions($subscriber, $creator)
            ->latest('ends_at')
            ->first();
    }

    /**
     * Determine whether the user has unlocked the given post via purchase or subscription.
     */
    public function hasUnlockedPost(User $user, Post $post): bool
    {
        if ($user->is($post->author)) {
            return true;
        }

        if ($post->author !== null && $this->hasActiveSubscription($user, $post->author)) {
            return true;
        }

        return PostPurchase::query()
            ->where('post_id', $post->getKey())
            ->where('user_id', $user->getKey())
            ->whereIn('status', [
                PostPurchaseStatus::Completed,
                PostPurchaseStatus::Pending,
            ])
            ->where(function (Builder $query): void {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', Carbon::now());
            })
            ->exists();
    }

    /**
     * Build the subscription query for a subscriber/creator pair.
     */
    protected function queryActiveSubscriptions(User $subscriber, User $creator): Builder
    {
        $now = Carbon::now();

        return PaymentSubscription::query()
            ->where('subscriber_id', $subscriber->getKey())
            ->where('creator_id', $creator->getKey())
            ->whereIn('status', [
                PaymentSubscriptionStatus::Active,
                PaymentSubscriptionStatus::Trialing,
                PaymentSubscriptionStatus::Grace,
            ])
            ->where(function (Builder $query) use ($now): void {
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>', $now);
            })
            ->where(function (Builder $query) use ($now): void {
                $query->whereNull('grace_ends_at')
                    ->orWhere('grace_ends_at', '>', $now);
            });
    }
}


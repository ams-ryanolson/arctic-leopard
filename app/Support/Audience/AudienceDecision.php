<?php

namespace App\Support\Audience;

use App\Enums\PostAudience;
use App\Models\Post;
use App\Models\PostPurchase;
use App\Models\User;
use App\Models\UserBlock;
use App\Services\Payments\EntitlementService;
use Illuminate\Support\Carbon;

class AudienceDecision
{
    public function __construct(
        public readonly Post $post,
        public readonly ?User $viewer,
        protected readonly EntitlementService $entitlements,
    ) {}

    public static function make(Post $post, ?User $viewer): self
    {
        return new self($post, $viewer, app(EntitlementService::class));
    }

    public function audience(): PostAudience
    {
        return $this->post->audience instanceof PostAudience
            ? $this->post->audience
            : PostAudience::from($this->post->audience);
    }

    public function viewerIsAuthor(): bool
    {
        return $this->viewer !== null && $this->viewer->getKey() === $this->post->user_id;
    }

    public function viewerIsSystemBypass(): bool
    {
        return $this->post->is_system && $this->viewer?->can('view system posts') === true;
    }

    public function isBlocked(): bool
    {
        if ($this->viewer === null) {
            return false;
        }

        $now = Carbon::now();

        return UserBlock::query()
            ->where(function ($query): void {
                $query->where('blocker_id', $this->post->user_id)
                    ->where('blocked_id', $this->viewer?->getKey());
            })
            ->orWhere(function ($query): void {
                $query->where('blocker_id', $this->viewer?->getKey())
                    ->where('blocked_id', $this->post->user_id);
            })
            ->where(function ($query) use ($now): void {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', $now);
            })
            ->exists();
    }

    public function requiresPurchase(): bool
    {
        if ($this->audience() !== PostAudience::PayToView) {
            return false;
        }

        if ($this->post->is_system) {
            return false;
        }

        if ($this->viewerIsAuthor()) {
            return false;
        }

        if ($this->viewer?->can('access paywalled content')) {
            return false;
        }

        return ! $this->viewerHasPurchase() && ! $this->viewerHasSubscription();
    }

    public function canView(): bool
    {
        if ($this->viewerIsAuthor() || $this->viewerIsSystemBypass()) {
            return true;
        }

        if ($this->post->is_system) {
            return true;
        }

        if ($this->isBlocked()) {
            return false;
        }

        return match ($this->audience()) {
            PostAudience::Public => true,
            PostAudience::Followers => $this->viewer !== null
                && $this->post->author !== null
                && $this->viewerIsFollowingAuthor(),
            PostAudience::Subscribers => $this->viewer !== null
                && $this->post->author !== null
                && ($this->viewer->can('access paywalled content') || $this->viewerHasSubscription()),
            PostAudience::PayToView => $this->viewer !== null
                && (
                    $this->viewer->can('access paywalled content')
                    || $this->viewerHasPurchase()
                    || $this->viewerHasSubscription()
                ),
        };
    }

    private function viewerIsFollowingAuthor(): bool
    {
        if ($this->viewer === null || $this->post->author === null) {
            return false;
        }

        if (! method_exists($this->viewer, 'isFollowing')) {
            return false;
        }

        return $this->viewer->isFollowing($this->post->author);
    }

    private function viewerHasSubscription(): bool
    {
        if ($this->viewer === null || $this->post->author === null) {
            return false;
        }

        return $this->entitlements->hasActiveSubscription($this->viewer, $this->post->author);
    }

    private function viewerHasPurchase(): bool
    {
        if ($this->viewer === null) {
            return false;
        }

        return PostPurchase::query()
            ->where('post_id', $this->post->getKey())
            ->where('user_id', $this->viewer->getKey())
            ->where(function ($query): void {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', Carbon::now());
            })
            ->exists();
    }
}

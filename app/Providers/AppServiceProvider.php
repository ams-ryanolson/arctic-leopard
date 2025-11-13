<?php

namespace App\Providers;

use App\Models\Circle;
use App\Models\Comment;
use App\Models\Conversation;
use App\Models\Event;
use App\Models\Message;
use App\Models\Post;
use App\Models\PostPoll;
use App\Models\PostPollVote;
use App\Models\User;
use App\Policies\CirclePolicy;
use App\Policies\CommentPolicy;
use App\Policies\ConversationPolicy;
use App\Policies\EventPolicy;
use App\Policies\MessagePolicy;
use App\Policies\PollVotePolicy;
use App\Policies\PostPolicy;
use App\Policies\ProfilePolicy;
use App\Services\Payments\EntitlementService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(User::class, ProfilePolicy::class);
        Gate::policy(Post::class, PostPolicy::class);
        Gate::policy(Comment::class, CommentPolicy::class);
        Gate::policy(PostPoll::class, PollVotePolicy::class);
        Gate::policy(PostPollVote::class, PollVotePolicy::class);
        Gate::policy(Circle::class, CirclePolicy::class);
        Gate::policy(Conversation::class, ConversationPolicy::class);
        Gate::policy(Message::class, MessagePolicy::class);
        Gate::policy(Event::class, EventPolicy::class);

        Gate::define('access-creator-content', function (User $viewer, User $creator): bool {
            if ($viewer->is($creator)) {
                return true;
            }

            if ($viewer->can('access paywalled content')) {
                return true;
            }

            /** @var EntitlementService $entitlements */
            $entitlements = app(EntitlementService::class);

            return $entitlements->hasActiveSubscription($viewer, $creator);
        });

        Gate::define('manage-creator-monetization', function (User $user, User $creator): bool {
            if ($user->can('manage payouts') || $user->can('manage discounts')) {
                return true;
            }

            if (! $user->is($creator)) {
                return false;
            }

            return $user->hasRole('Creator') || $user->can('create subscription plans');
        });
    }
}

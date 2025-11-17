<?php

namespace App\Providers;

use App\Events\Memberships\MembershipCancelled;
use App\Events\Memberships\MembershipExpired;
use App\Events\Memberships\MembershipPurchased;
use App\Events\Memberships\MembershipRenewed;
use App\Events\Memberships\MembershipUpgraded;
use App\Events\Payments\PaymentCancelled;
use App\Events\Payments\PaymentCaptured;
use App\Events\Payments\PaymentFailed;
use App\Events\Payments\PaymentInitiated;
use App\Events\Payments\PaymentIntentCancelled;
use App\Events\Payments\PaymentIntentCreated;
use App\Events\Payments\PaymentIntentSucceeded;
use App\Events\Payments\PaymentRefunded;
use App\Events\Payments\SubscriptionCancelled;
use App\Events\Payments\SubscriptionEnteredGrace;
use App\Events\Payments\SubscriptionExpired;
use App\Events\Payments\SubscriptionPaymentFailed;
use App\Events\Payments\SubscriptionRenewed;
use App\Events\Payments\SubscriptionStarted;
use App\Events\PostAudienceChanged;
use App\Events\PostBookmarked;
use App\Events\PostDeleted;
use App\Events\PostLiked;
use App\Events\PostPublished;
use App\Events\UserBlocked;
use App\Events\UserFollowAccepted;
use App\Events\UserFollowRequested;
use App\Events\UserUnblocked;
use App\Events\Wishlists\WishlistPurchaseCompleted;
use App\Listeners\Ads\ActivateAdOnPaymentCaptured;
use App\Listeners\DispatchUserFollowedEvent;
use App\Listeners\FlushTimelinesOnBlock;
use App\Listeners\LogTwoFactorDisabled;
use App\Listeners\LogTwoFactorEnabled;
use App\Listeners\LogUserBlockLifecycle;
use App\Listeners\LogUserLogin;
use App\Listeners\LogUserLogout;
use App\Listeners\Memberships\AssignRoleOnMembershipPurchased;
use App\Listeners\Memberships\LogMembershipUpgrade;
use App\Listeners\Memberships\ProcessRecurringRenewal;
use App\Listeners\Memberships\RemoveRoleOnMembershipExpired;
use App\Listeners\Memberships\UpdateRoleOnMembershipUpgraded;
use App\Listeners\Payments\CompletePostPurchaseOnPaymentCaptured;
use App\Listeners\Payments\CompleteTipOnPaymentCaptured;
use App\Listeners\Payments\CreateMembershipOnPaymentCaptured;
use App\Listeners\Payments\FailPostPurchaseOnPaymentFailed;
use App\Listeners\Payments\FailTipOnPaymentFailed;
use App\Listeners\Payments\FailWishlistPurchaseOnPaymentFailed;
use App\Listeners\Payments\FulfillWishlistPurchaseOnPaymentCaptured;
use App\Listeners\Payments\LogPaymentActivity;
use App\Listeners\Payments\LogPaymentIntentLifecycle;
use App\Listeners\Payments\LogPaymentLifecycle;
use App\Listeners\Payments\LogSubscriptionLifecycle;
use App\Listeners\Payments\RefundPostPurchaseOnPaymentRefunded;
use App\Listeners\Payments\RefundTipOnPaymentRefunded;
use App\Listeners\Payments\RefundWishlistPurchaseOnPaymentRefunded;
use App\Listeners\Payments\TouchPaymentMethodOnUse;
use App\Listeners\Payments\UpdateLedgerOnPaymentCaptured;
use App\Listeners\Payments\UpdateLedgerOnPaymentRefunded;
use App\Listeners\PurgeNotificationsForBlockedUsers;
use App\Listeners\QueueTimelineFanOut;
use App\Listeners\RefreshFollowerTimeline;
use App\Listeners\RefreshTimelineForAudienceChange;
use App\Listeners\RemovePostFromTimelines;
use App\Listeners\SendFollowRequestApprovedNotification;
use App\Listeners\SendPostBookmarkedNotification;
use App\Listeners\SendPostLikedNotification;
use App\Listeners\SendUserFollowedNotification;
use App\Listeners\SendUserFollowRequestedNotification;
use App\Listeners\Wishlists\SendWishlistThankYouNotification;
use App\Listeners\Wishlists\UpdateWishlistItemStatus;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;
use Laravel\Fortify\Events\TwoFactorAuthenticationDisabled;
use Laravel\Fortify\Events\TwoFactorAuthenticationEnabled;
use Overtrue\LaravelFollow\Events\Followed as FollowedEvent;

class EventServiceProvider extends ServiceProvider
{
    /**
     * Indicates if events should be automatically discovered.
     *
     * @var bool
     */
    protected static $shouldDiscoverEvents = false;

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }

    public function boot(): void
    {
        parent::boot();

        Event::listen(FollowedEvent::class, [DispatchUserFollowedEvent::class, 'handle']);
        Event::listen(UserFollowRequested::class, [SendUserFollowRequestedNotification::class, 'handle']);
        Event::listen(UserFollowAccepted::class, [SendUserFollowedNotification::class, 'handle']);
        Event::listen(UserFollowAccepted::class, [SendFollowRequestApprovedNotification::class, 'handle']);
    }

    /**
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        PostPublished::class => [
            QueueTimelineFanOut::class,
        ],
        PostLiked::class => [
            SendPostLikedNotification::class,
        ],
        PostBookmarked::class => [
            SendPostBookmarkedNotification::class,
        ],
        PostAudienceChanged::class => [
            RefreshTimelineForAudienceChange::class,
        ],
        PostDeleted::class => [
            RemovePostFromTimelines::class,
        ],
        UserBlocked::class => [
            FlushTimelinesOnBlock::class,
            PurgeNotificationsForBlockedUsers::class,
            LogUserBlockLifecycle::class,
        ],
        UserUnblocked::class => [
            LogUserBlockLifecycle::class,
        ],
        UserFollowAccepted::class => [
            RefreshFollowerTimeline::class,
        ],
        Login::class => [
            LogUserLogin::class,
        ],
        Logout::class => [
            LogUserLogout::class,
        ],
        TwoFactorAuthenticationEnabled::class => [
            LogTwoFactorEnabled::class,
        ],
        TwoFactorAuthenticationDisabled::class => [
            LogTwoFactorDisabled::class,
        ],
        PaymentInitiated::class => [
            LogPaymentLifecycle::class,
        ],
        PaymentCaptured::class => [
            LogPaymentLifecycle::class,
            TouchPaymentMethodOnUse::class,
            UpdateLedgerOnPaymentCaptured::class,
            CompleteTipOnPaymentCaptured::class,
            FulfillWishlistPurchaseOnPaymentCaptured::class,
            CompletePostPurchaseOnPaymentCaptured::class,
            ActivateAdOnPaymentCaptured::class,
            CreateMembershipOnPaymentCaptured::class,
            LogPaymentActivity::class.'@handlePaymentCaptured',
        ],
        PaymentFailed::class => [
            LogPaymentLifecycle::class,
            FailTipOnPaymentFailed::class,
            FailWishlistPurchaseOnPaymentFailed::class,
            FailPostPurchaseOnPaymentFailed::class,
        ],
        PaymentRefunded::class => [
            LogPaymentLifecycle::class,
            UpdateLedgerOnPaymentRefunded::class,
            RefundTipOnPaymentRefunded::class,
            RefundWishlistPurchaseOnPaymentRefunded::class,
            RefundPostPurchaseOnPaymentRefunded::class,
            LogPaymentActivity::class.'@handlePaymentRefunded',
        ],
        PaymentCancelled::class => [
            LogPaymentLifecycle::class,
        ],
        PaymentIntentCreated::class => [
            LogPaymentIntentLifecycle::class,
        ],
        PaymentIntentSucceeded::class => [
            LogPaymentIntentLifecycle::class,
        ],
        PaymentIntentCancelled::class => [
            LogPaymentIntentLifecycle::class,
        ],
        SubscriptionStarted::class => [
            LogSubscriptionLifecycle::class,
        ],
        SubscriptionRenewed::class => [
            LogSubscriptionLifecycle::class,
        ],
        SubscriptionCancelled::class => [
            LogSubscriptionLifecycle::class,
        ],
        SubscriptionExpired::class => [
            LogSubscriptionLifecycle::class,
        ],
        SubscriptionEnteredGrace::class => [
            LogSubscriptionLifecycle::class,
        ],
        SubscriptionPaymentFailed::class => [
            LogSubscriptionLifecycle::class,
        ],
        MembershipPurchased::class => [
            AssignRoleOnMembershipPurchased::class,
        ],
        MembershipUpgraded::class => [
            UpdateRoleOnMembershipUpgraded::class,
            LogMembershipUpgrade::class,
        ],
        MembershipRenewed::class => [
            ProcessRecurringRenewal::class,
        ],
        MembershipExpired::class => [
            RemoveRoleOnMembershipExpired::class,
        ],
        MembershipCancelled::class => [
            // Can add listeners here if needed
        ],
        WishlistPurchaseCompleted::class => [
            UpdateWishlistItemStatus::class,
            SendWishlistThankYouNotification::class,
        ],
    ];
}

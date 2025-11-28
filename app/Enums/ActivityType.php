<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

enum ActivityType: string
{
    use HasValues;

    // Authentication
    case UserLogin = 'user.login';
    case UserLogout = 'user.logout';

    // Security
    case PasswordChanged = 'security.password_changed';
    case TwoFactorEnabled = 'security.two_factor_enabled';
    case TwoFactorDisabled = 'security.two_factor_disabled';

    // Membership
    case MembershipUpgraded = 'membership.upgraded';

    // Admin
    case RolePermissionsChanged = 'admin.role_permissions_changed';

    // Payments
    case PurchaseTip = 'payment.tip';
    case PurchaseWishlist = 'payment.wishlist';
    case PurchasePost = 'payment.post';
    case PurchaseMembership = 'payment.membership';
    case PurchaseSubscription = 'payment.subscription';
    case PurchaseAd = 'payment.ad';
    case PaymentRefunded = 'payment.refunded';

    // User Management
    case UserSuspended = 'admin.user_suspended';
    case UserUnsuspended = 'admin.user_unsuspended';
    case UserBanned = 'admin.user_banned';
    case UserUnbanned = 'admin.user_unbanned';
    case UserWarned = 'admin.user_warned';
    case FreeMembershipGranted = 'admin.free_membership_granted';
    case AppealSubmitted = 'admin.appeal_submitted';
    case AppealApproved = 'admin.appeal_approved';
    case AppealRejected = 'admin.appeal_rejected';

    // Content Moderation
    case ContentQueuedForModeration = 'moderation.content_queued';
    case ContentApproved = 'moderation.content_approved';
    case ContentRejected = 'moderation.content_rejected';
    case ContentDismissed = 'moderation.content_dismissed';
}

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
}

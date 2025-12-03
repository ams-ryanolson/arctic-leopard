/**
 * Build script to convert React Email templates to Laravel Blade templates
 * 
 * Usage: npx tsx scripts/build-emails.tsx
 */

import { render } from '@react-email/render';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Import all templates
import WelcomeEmail from '../resources/emails/welcome';
import VerifyEmail from '../resources/emails/verify-email';
import ResetPassword from '../resources/emails/reset-password';
import PasswordChanged from '../resources/emails/password-changed';
import EmailChanged from '../resources/emails/email-changed';
import LoginNewDevice from '../resources/emails/login-new-device';
import TwoFactorEnabled from '../resources/emails/two-factor-enabled';
import TwoFactorDisabled from '../resources/emails/two-factor-disabled';
import MagicLink from '../resources/emails/magic-link';
import NewFollower from '../resources/emails/new-follower';
import NewMessage from '../resources/emails/new-message';
import PostLiked from '../resources/emails/post-liked';
import PostCommented from '../resources/emails/post-commented';
import Mentioned from '../resources/emails/mentioned';
import CreatorPosted from '../resources/emails/creator-posted';
import NewSubscriber from '../resources/emails/new-subscriber';
import SubscriptionConfirmed from '../resources/emails/subscription-confirmed';
import SubscriptionCancelled from '../resources/emails/subscription-cancelled';
import SubscriptionExpiring from '../resources/emails/subscription-expiring';
import TipReceived from '../resources/emails/tip-received';
import PaymentReceipt from '../resources/emails/payment-receipt';
import PaymentFailed from '../resources/emails/payment-failed';
import PayoutProcessed from '../resources/emails/payout-processed';
import WishlistPurchased from '../resources/emails/wishlist-purchased';
import RefundProcessed from '../resources/emails/refund-processed';
import AccountSuspended from '../resources/emails/account-suspended';
import AccountReactivated from '../resources/emails/account-reactivated';
import ContentRemoved from '../resources/emails/content-removed';
import VerificationApproved from '../resources/emails/verification-approved';
import VerificationRejected from '../resources/emails/verification-rejected';
import WeeklyDigest from '../resources/emails/weekly-digest';
import UnreadMessages from '../resources/emails/unread-messages';
import WeMissYou from '../resources/emails/we-miss-you';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../resources/views/emails');

// Template configurations with Blade variable placeholders
const templates: Record<string, { Component: React.FC<any>; props: Record<string, any> }> = {
    'welcome': {
        Component: WelcomeEmail,
        props: { 
            username: '{{ $username }}',
            displayName: '{{ $displayName }}'
        }
    },
    'verify-email': {
        Component: VerifyEmail,
        props: { 
            username: '{{ $username }}',
            verificationUrl: '{{ $verificationUrl }}'
        }
    },
    'reset-password': {
        Component: ResetPassword,
        props: {
            username: '{{ $username }}',
            resetUrl: '{{ $resetUrl }}'
        }
    },
    'password-changed': {
        Component: PasswordChanged,
        props: {
            username: '{{ $username }}',
            changedAt: '{{ $changedAt }}',
            ipAddress: '{{ $ipAddress }}',
            location: '{{ $location }}'
        }
    },
    'email-changed': {
        Component: EmailChanged,
        props: {
            username: '{{ $username }}',
            oldEmail: '{{ $oldEmail }}',
            newEmail: '{{ $newEmail }}',
            changedAt: '{{ $changedAt }}'
        }
    },
    'login-new-device': {
        Component: LoginNewDevice,
        props: {
            username: '{{ $username }}',
            device: '{{ $device }}',
            browser: '{{ $browser }}',
            ipAddress: '{{ $ipAddress }}',
            location: '{{ $location }}',
            loginTime: '{{ $loginTime }}'
        }
    },
    'two-factor-enabled': {
        Component: TwoFactorEnabled,
        props: {
            username: '{{ $username }}',
            enabledAt: '{{ $enabledAt }}'
        }
    },
    'two-factor-disabled': {
        Component: TwoFactorDisabled,
        props: {
            username: '{{ $username }}',
            disabledAt: '{{ $disabledAt }}'
        }
    },
    'magic-link': {
        Component: MagicLink,
        props: {
            username: '{{ $username }}',
            loginUrl: '{{ $loginUrl }}',
            otp: '{{ $otp }}',
            expiresIn: '{{ $expiresIn }}',
            ipAddress: '{{ $ipAddress }}',
            location: '{{ $location }}'
        }
    },
    'new-follower': {
        Component: NewFollower,
        props: {
            username: '{{ $username }}',
            followerUsername: '{{ $followerUsername }}',
            followerProfileUrl: '{{ $followerProfileUrl }}'
        }
    },
    'new-message': {
        Component: NewMessage,
        props: {
            username: '{{ $username }}',
            senderUsername: '{{ $senderUsername }}',
            messagePreview: '{{ $messagePreview }}',
            conversationUrl: '{{ $conversationUrl }}'
        }
    },
    'post-liked': {
        Component: PostLiked,
        props: {
            recipientName: '{{ $recipientName }}',
            likerName: '{{ $likerName }}',
            likerUsername: '{{ $likerUsername }}',
            likerAvatarUrl: '{{ $likerAvatarUrl }}',
            postPreview: '{{ $postPreview }}',
            postUrl: '{{ $postUrl }}',
            totalLikes: '{{ $totalLikes }}'
        }
    },
    'post-commented': {
        Component: PostCommented,
        props: {
            recipientName: '{{ $recipientName }}',
            commenterName: '{{ $commenterName }}',
            commenterUsername: '{{ $commenterUsername }}',
            commenterAvatarUrl: '{{ $commenterAvatarUrl }}',
            commentText: '{{ $commentText }}',
            postPreview: '{{ $postPreview }}',
            postUrl: '{{ $postUrl }}'
        }
    },
    'mentioned': {
        Component: Mentioned,
        props: {
            recipientName: '{{ $recipientName }}',
            mentionerName: '{{ $mentionerName }}',
            mentionerUsername: '{{ $mentionerUsername }}',
            mentionerAvatarUrl: '{{ $mentionerAvatarUrl }}',
            context: '{{ $context }}',
            postUrl: '{{ $postUrl }}'
        }
    },
    'creator-posted': {
        Component: CreatorPosted,
        props: {
            subscriberName: '{{ $subscriberName }}',
            creatorName: '{{ $creatorName }}',
            creatorUsername: '{{ $creatorUsername }}',
            creatorAvatarUrl: '{{ $creatorAvatarUrl }}',
            postPreview: '{{ $postPreview }}',
            postUrl: '{{ $postUrl }}',
            isExclusive: true
        }
    },
    'new-subscriber': {
        Component: NewSubscriber,
        props: {
            creatorUsername: '{{ $creatorUsername }}',
            subscriberUsername: '{{ $subscriberUsername }}',
            subscriptionAmount: '{{ $subscriptionAmount }}',
            profileUrl: '{{ $profileUrl }}'
        }
    },
    'subscription-confirmed': {
        Component: SubscriptionConfirmed,
        props: {
            username: '{{ $username }}',
            creatorUsername: '{{ $creatorUsername }}',
            amount: '{{ $amount }}',
            planName: '{{ $planName }}',
            dashboardUrl: '{{ $dashboardUrl }}'
        }
    },
    'subscription-cancelled': {
        Component: SubscriptionCancelled,
        props: {
            subscriberName: '{{ $subscriberName }}',
            creatorName: '{{ $creatorName }}',
            creatorUsername: '{{ $creatorUsername }}',
            creatorAvatarUrl: '{{ $creatorAvatarUrl }}',
            tierName: '{{ $tierName }}',
            accessEndsAt: '{{ $accessEndsAt }}',
            creatorProfileUrl: '{{ $creatorProfileUrl }}'
        }
    },
    'subscription-expiring': {
        Component: SubscriptionExpiring,
        props: {
            subscriberName: '{{ $subscriberName }}',
            creatorName: '{{ $creatorName }}',
            creatorUsername: '{{ $creatorUsername }}',
            creatorAvatarUrl: '{{ $creatorAvatarUrl }}',
            tierName: '{{ $tierName }}',
            expiresAt: '{{ $expiresAt }}',
            daysRemaining: '{{ $daysRemaining }}',
            creatorProfileUrl: '{{ $creatorProfileUrl }}'
        }
    },
    'tip-received': {
        Component: TipReceived,
        props: {
            creatorUsername: '{{ $creatorUsername }}',
            tipperUsername: '{{ $tipperUsername }}',
            amount: '{{ $amount }}',
            message: '{{ $message }}',
            profileUrl: '{{ $profileUrl }}'
        }
    },
    'payment-receipt': {
        Component: PaymentReceipt,
        props: {
            customerName: '{{ $customerName }}',
            transactionId: '{{ $transactionId }}',
            date: '{{ $date }}',
            subtotal: '{{ $subtotal }}',
            tax: '{{ $tax }}',
            total: '{{ $total }}',
            paymentMethod: '{{ $paymentMethod }}',
            last4: '{{ $last4 }}',
            items: [{ description: '{{ $itemDescription }}', amount: '{{ $itemAmount }}' }]
        }
    },
    'payment-failed': {
        Component: PaymentFailed,
        props: {
            customerName: '{{ $customerName }}',
            itemDescription: '{{ $itemDescription }}',
            amount: '{{ $amount }}',
            failureReason: '{{ $failureReason }}',
            retryDate: '{{ $retryDate }}',
            paymentMethod: '{{ $paymentMethod }}',
            last4: '{{ $last4 }}'
        }
    },
    'payout-processed': {
        Component: PayoutProcessed,
        props: {
            creatorName: '{{ $creatorName }}',
            amount: '{{ $amount }}',
            payoutMethod: '{{ $payoutMethod }}',
            estimatedArrival: '{{ $estimatedArrival }}',
            periodStart: '{{ $periodStart }}',
            periodEnd: '{{ $periodEnd }}',
            subscriptionEarnings: '{{ $subscriptionEarnings }}',
            tipEarnings: '{{ $tipEarnings }}',
            platformFee: '{{ $platformFee }}',
            netAmount: '{{ $netAmount }}'
        }
    },
    'wishlist-purchased': {
        Component: WishlistPurchased,
        props: {
            creatorName: '{{ $creatorName }}',
            buyerName: '{{ $buyerName }}',
            buyerUsername: '{{ $buyerUsername }}',
            buyerAvatarUrl: '{{ $buyerAvatarUrl }}',
            itemName: '{{ $itemName }}',
            itemPrice: '{{ $itemPrice }}',
            message: '{{ $message }}'
        }
    },
    'refund-processed': {
        Component: RefundProcessed,
        props: {
            customerName: '{{ $customerName }}',
            transactionId: '{{ $transactionId }}',
            originalTransactionId: '{{ $originalTransactionId }}',
            amount: '{{ $amount }}',
            reason: '{{ $reason }}',
            refundDate: '{{ $refundDate }}',
            estimatedArrival: '{{ $estimatedArrival }}',
            paymentMethod: '{{ $paymentMethod }}',
            last4: '{{ $last4 }}'
        }
    },
    'account-suspended': {
        Component: AccountSuspended,
        props: {
            username: '{{ $username }}',
            reason: '{{ $reason }}',
            suspensionType: 'temporary',
            expiresAt: '{{ $expiresAt }}',
            appealUrl: '{{ $appealUrl }}'
        }
    },
    'account-reactivated': {
        Component: AccountReactivated,
        props: {
            username: '{{ $username }}'
        }
    },
    'content-removed': {
        Component: ContentRemoved,
        props: {
            username: '{{ $username }}',
            contentType: 'post',
            reason: '{{ $reason }}',
            removedAt: '{{ $removedAt }}',
            appealUrl: '{{ $appealUrl }}'
        }
    },
    'verification-approved': {
        Component: VerificationApproved,
        props: {
            username: '{{ $username }}',
            verificationType: 'identity'
        }
    },
    'verification-rejected': {
        Component: VerificationRejected,
        props: {
            username: '{{ $username }}',
            verificationType: 'identity',
            reason: '{{ $reason }}',
            canReapply: true
        }
    },
    'weekly-digest': {
        Component: WeeklyDigest,
        props: {
            username: '{{ $username }}',
            profileViews: '{{ $profileViews }}',
            newFollowers: '{{ $newFollowers }}',
            newLikes: '{{ $newLikes }}',
            newMessages: '{{ $newMessages }}'
        }
    },
    'unread-messages': {
        Component: UnreadMessages,
        props: {
            username: '{{ $username }}',
            unreadCount: '{{ $unreadCount }}',
            messages: []
        }
    },
    'we-miss-you': {
        Component: WeMissYou,
        props: {
            username: '{{ $username }}',
            lastSeenDays: '{{ $lastSeenDays }}',
            newFollowers: '{{ $newFollowers }}',
            newMessages: '{{ $newMessages }}',
            newContent: '{{ $newContent }}'
        }
    }
};

async function buildTemplate(name: string, config: { Component: React.FC<any>; props: Record<string, any> }) {
    try {
        const html = await render(config.Component(config.props), { pretty: true });
        const outputPath = path.join(OUTPUT_DIR, `${name}.blade.php`);
        fs.writeFileSync(outputPath, html);
        console.log(`✅ Built ${name}.blade.php`);
    } catch (error) {
        console.error(`❌ Failed to build ${name}:`, error);
    }
}

async function main() {
    console.log('🔨 Building React Email templates to Blade...\n');

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Build all templates
    for (const [name, config] of Object.entries(templates)) {
        await buildTemplate(name, config);
    }

    console.log(`\n✨ Done! Built ${Object.keys(templates).length} templates.`);
}

main().catch(console.error);


import { Heading, Section, Text } from '@react-email/components';
import * as React from 'react';

import {
    colors,
    Divider,
    EmailWrapper,
    HighlightBox,
    PrimaryButton,
    styles,
    UserCard,
} from './components/shared';

interface SubscriptionExpiringEmailProps {
    subscriberName: string;
    creatorName: string;
    creatorUsername: string;
    creatorAvatarUrl?: string;
    tierName: string;
    expiresAt: string;
    daysRemaining: number;
    creatorProfileUrl: string;
}

export default function SubscriptionExpiringEmail({
    subscriberName = 'Kinkster',
    creatorName = 'MasterJohn',
    creatorUsername = 'masterjohn',
    creatorAvatarUrl = 'https://beta-cdn.realkink.men/emails/default-avatar.png',
    tierName = 'Gold Member',
    expiresAt = 'December 10, 2025',
    daysRemaining = 3,
    creatorProfileUrl = 'https://realkink.men/@masterjohn',
}: SubscriptionExpiringEmailProps) {
    return (
        <EmailWrapper
            preview={`Your subscription to ${creatorName} expires in ${daysRemaining} days`}
        >
            <Heading style={styles.heading}>Subscription Expiring ⏰</Heading>
            <Text style={styles.subheading}>
                Don't lose access to exclusive content
            </Text>

            <UserCard
                avatarUrl={creatorAvatarUrl}
                name={creatorName}
                username={creatorUsername}
            />

            <Section
                style={{
                    background: `linear-gradient(135deg, rgba(251, 191, 36, 0.2), ${colors.primaryGlow})`,
                    borderRadius: '16px',
                    padding: '24px',
                    margin: '24px 0',
                    textAlign: 'center',
                }}
            >
                <Text
                    style={{
                        color: colors.textMuted,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        margin: '0 0 8px',
                    }}
                >
                    Expires In
                </Text>
                <Text
                    style={{
                        color: colors.accent,
                        fontSize: '48px',
                        fontWeight: '800',
                        margin: '0',
                        letterSpacing: '-2px',
                    }}
                >
                    {daysRemaining}
                </Text>
                <Text
                    style={{
                        color: colors.text,
                        fontSize: '16px',
                        fontWeight: '500',
                        margin: '4px 0 0',
                    }}
                >
                    days
                </Text>
            </Section>

            <Text style={styles.paragraph}>
                Hey {subscriberName}, your {tierName} subscription to{' '}
                {creatorName} is expiring on {expiresAt}. Renew now to keep
                enjoying:
            </Text>

            <HighlightBox>
                <Text
                    style={{
                        color: colors.text,
                        fontSize: '14px',
                        margin: 0,
                        lineHeight: '26px',
                    }}
                >
                    ✓ All subscriber-only posts
                    <br />
                    ✓ Direct messaging
                    <br />
                    ✓ Exclusive photos & videos
                    <br />✓ Early access to new content
                </Text>
            </HighlightBox>

            <PrimaryButton href={creatorProfileUrl}>
                Renew Subscription
            </PrimaryButton>

            <Divider />

            <Text
                style={{
                    ...styles.paragraph,
                    fontSize: '12px',
                    textAlign: 'center',
                    color: colors.textSubtle,
                    marginBottom: 0,
                }}
            >
                No longer interested?{' '}
                <a
                    href="https://realkink.men/settings/subscriptions"
                    style={styles.link}
                >
                    Manage subscriptions
                </a>
            </Text>
        </EmailWrapper>
    );
}


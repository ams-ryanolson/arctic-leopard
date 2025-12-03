import { Heading, Section, Text } from '@react-email/components';
import * as React from 'react';

import {
    Badge,
    colors,
    Divider,
    EmailWrapper,
    HighlightBox,
    PrimaryButton,
    styles,
    UserCard,
} from './components/shared';

interface SubscriptionConfirmedEmailProps {
    subscriberName: string;
    creatorName: string;
    creatorUsername: string;
    creatorAvatarUrl?: string;
    tierName: string;
    price: string;
    billingPeriod: string;
    creatorProfileUrl: string;
}

export default function SubscriptionConfirmedEmail({
    subscriberName = 'Kinkster',
    creatorName = 'MasterJohn',
    creatorUsername = 'masterjohn',
    creatorAvatarUrl = 'https://beta-cdn.realkink.men/emails/default-avatar.png',
    tierName = 'Gold Member',
    price = '$9.99',
    billingPeriod = 'monthly',
    creatorProfileUrl = 'https://realkink.men/@masterjohn',
}: SubscriptionConfirmedEmailProps) {
    return (
        <EmailWrapper
            preview={`You're now subscribed to ${creatorName}! 🎉`}
        >
            <Heading style={styles.heading}>Subscription Confirmed! 🎉</Heading>
            <Text style={styles.subheading}>
                You now have exclusive access to {creatorName}'s content
            </Text>

            <UserCard
                avatarUrl={creatorAvatarUrl}
                name={creatorName}
                username={creatorUsername}
            />

            <Section
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    padding: '24px',
                    margin: '24px 0',
                }}
            >
                <Text
                    style={{
                        color: colors.textMuted,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        margin: '0 0 8px',
                        textAlign: 'center',
                    }}
                >
                    Your Subscription
                </Text>
                <Text
                    style={{
                        color: colors.text,
                        fontSize: '24px',
                        fontWeight: '700',
                        margin: '0 0 4px',
                        textAlign: 'center',
                    }}
                >
                    {tierName}
                </Text>
                <Text
                    style={{
                        color: colors.primary,
                        fontSize: '18px',
                        fontWeight: '600',
                        margin: '0',
                        textAlign: 'center',
                    }}
                >
                    {price}/{billingPeriod}
                </Text>
            </Section>

            <HighlightBox>
                <Text
                    style={{
                        color: colors.text,
                        fontSize: '14px',
                        margin: 0,
                        lineHeight: '22px',
                    }}
                >
                    <strong>What you get:</strong>
                    <br />• Access to all subscriber-only posts
                    <br />• Direct messaging with the creator
                    <br />• Exclusive photos & videos
                    <br />• Early access to new content
                </Text>
            </HighlightBox>

            <PrimaryButton href={creatorProfileUrl}>
                View Exclusive Content
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
                You can manage your subscription anytime in{' '}
                <a
                    href="https://realkink.men/settings/subscriptions"
                    style={styles.link}
                >
                    Settings → Subscriptions
                </a>
            </Text>
        </EmailWrapper>
    );
}


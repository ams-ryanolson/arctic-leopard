import { Heading, Section, Text } from '@react-email/components';
import * as React from 'react';

import {
    colors,
    Divider,
    EmailWrapper,
    PrimaryButton,
    SecondaryButton,
    styles,
    UserCard,
} from './components/shared';

interface SubscriptionCancelledEmailProps {
    subscriberName: string;
    creatorName: string;
    creatorUsername: string;
    creatorAvatarUrl?: string;
    tierName: string;
    accessEndsAt: string;
    creatorProfileUrl: string;
}

export default function SubscriptionCancelledEmail({
    subscriberName = 'Kinkster',
    creatorName = 'MasterJohn',
    creatorUsername = 'masterjohn',
    creatorAvatarUrl = 'https://beta-cdn.realkink.men/emails/default-avatar.png',
    tierName = 'Gold Member',
    accessEndsAt = 'January 3, 2026',
    creatorProfileUrl = 'https://realkink.men/@masterjohn',
}: SubscriptionCancelledEmailProps) {
    return (
        <EmailWrapper
            preview={`Your subscription to ${creatorName} has been cancelled`}
        >
            <Heading style={styles.heading}>Subscription Cancelled</Heading>
            <Text style={styles.subheading}>
                We're sorry to see you go
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
                    Access Until
                </Text>
                <Text
                    style={{
                        color: colors.text,
                        fontSize: '20px',
                        fontWeight: '700',
                        margin: 0,
                    }}
                >
                    {accessEndsAt}
                </Text>
                <Text
                    style={{
                        color: colors.textSubtle,
                        fontSize: '13px',
                        margin: '8px 0 0',
                    }}
                >
                    You'll continue to have {tierName} access until this date
                </Text>
            </Section>

            <Text style={styles.paragraph}>
                Hey {subscriberName}, your subscription to {creatorName} has
                been cancelled. You won't be charged again, but you'll keep
                access to their exclusive content until your current billing
                period ends.
            </Text>

            <Text style={styles.paragraph}>
                Changed your mind? You can resubscribe anytime to keep enjoying
                their exclusive content.
            </Text>

            <PrimaryButton href={creatorProfileUrl}>
                Resubscribe
            </PrimaryButton>

            <Divider />

            <Section style={{ textAlign: 'center' }}>
                <Text
                    style={{
                        color: colors.textMuted,
                        fontSize: '13px',
                        margin: '0 0 16px',
                    }}
                >
                    We'd love to know what we could do better
                </Text>
                <SecondaryButton href="https://realkink.men/feedback">
                    Share Feedback
                </SecondaryButton>
            </Section>
        </EmailWrapper>
    );
}


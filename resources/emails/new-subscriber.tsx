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

interface NewSubscriberEmailProps {
    creatorName: string;
    subscriberName: string;
    subscriberUsername: string;
    subscriberAvatarUrl?: string;
    tierName: string;
    monthlyRevenue: string;
    totalSubscribers: number;
    dashboardUrl: string;
}

export default function NewSubscriberEmail({
    creatorName = 'Creator',
    subscriberName = 'EagerFan',
    subscriberUsername = 'eagerfan',
    subscriberAvatarUrl = 'https://beta-cdn.realkink.men/emails/default-avatar.png',
    tierName = 'Gold Member',
    monthlyRevenue = '$299.00',
    totalSubscribers = 42,
    dashboardUrl = 'https://realkink.men/creator/dashboard',
}: NewSubscriberEmailProps) {
    return (
        <EmailWrapper
            preview={`🎉 ${subscriberName} just subscribed to your ${tierName} tier!`}
        >
            <Heading style={styles.heading}>New Subscriber! 🎉</Heading>
            <Text style={styles.subheading}>
                Someone just unlocked your exclusive content
            </Text>

            <UserCard
                avatarUrl={subscriberAvatarUrl}
                name={subscriberName}
                username={subscriberUsername}
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
                        margin: '0 0 4px',
                    }}
                >
                    Subscribed to
                </Text>
                <Text
                    style={{
                        color: colors.primary,
                        fontSize: '20px',
                        fontWeight: '700',
                        margin: '0',
                    }}
                >
                    {tierName}
                </Text>
            </Section>

            <Section
                style={{
                    display: 'flex',
                    margin: '24px 0',
                }}
            >
                <table
                    style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                    }}
                >
                    <tr>
                        <td
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px',
                                padding: '20px',
                                textAlign: 'center',
                                width: '50%',
                            }}
                        >
                            <Text
                                style={{
                                    color: colors.textMuted,
                                    fontSize: '11px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    margin: '0 0 4px',
                                }}
                            >
                                Monthly Revenue
                            </Text>
                            <Text
                                style={{
                                    color: colors.success,
                                    fontSize: '24px',
                                    fontWeight: '700',
                                    margin: '0',
                                }}
                            >
                                {monthlyRevenue}
                            </Text>
                        </td>
                        <td style={{ width: '12px' }}></td>
                        <td
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px',
                                padding: '20px',
                                textAlign: 'center',
                                width: '50%',
                            }}
                        >
                            <Text
                                style={{
                                    color: colors.textMuted,
                                    fontSize: '11px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    margin: '0 0 4px',
                                }}
                            >
                                Total Subscribers
                            </Text>
                            <Text
                                style={{
                                    color: colors.text,
                                    fontSize: '24px',
                                    fontWeight: '700',
                                    margin: '0',
                                }}
                            >
                                {totalSubscribers}
                            </Text>
                        </td>
                    </tr>
                </table>
            </Section>

            <PrimaryButton href={dashboardUrl}>View Dashboard</PrimaryButton>

            <Divider />

            <Section style={{ textAlign: 'center' }}>
                <Text
                    style={{
                        color: colors.textMuted,
                        fontSize: '13px',
                        margin: '0 0 16px',
                    }}
                >
                    Welcome them with exclusive content!
                </Text>
                <SecondaryButton href="https://realkink.men/posts/create">
                    Create a Post
                </SecondaryButton>
            </Section>
        </EmailWrapper>
    );
}


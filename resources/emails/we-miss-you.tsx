import { Heading, Section, Text } from '@react-email/components';
import * as React from 'react';

import {
    colors,
    Divider,
    EmailWrapper,
    PrimaryButton,
    styles,
} from './components/shared';

interface WeMissYouEmailProps {
    username: string;
    lastSeenDays: number;
    newFollowers?: number;
    newMessages?: number;
    newContent?: number;
}

export default function WeMissYouEmail({
    username = 'kinkster',
    lastSeenDays = 14,
    newFollowers = 3,
    newMessages = 7,
    newContent = 42,
}: WeMissYouEmailProps) {
    return (
        <EmailWrapper
            preview={`We miss you, ${username}! Here's what you've been missing...`}
        >
            <Heading style={styles.heading}>We Miss You! 👋</Heading>
            <Text style={styles.subheading}>
                It's been {lastSeenDays} days since your last visit
            </Text>

            <Text style={styles.paragraph}>
                Hey {username}, the community hasn't been the same without you!
                Here's what you've missed while you were away:
            </Text>

            <Section style={{ margin: '32px 0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tr>
                        <td
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px',
                                padding: '20px',
                                textAlign: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    color: colors.success,
                                    fontSize: '36px',
                                    fontWeight: '800',
                                    margin: '0',
                                }}
                            >
                                +{newFollowers}
                            </Text>
                            <Text
                                style={{
                                    color: colors.textMuted,
                                    fontSize: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    margin: '4px 0 0',
                                }}
                            >
                                New Followers
                            </Text>
                        </td>
                        <td style={{ width: '12px' }}></td>
                        <td
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px',
                                padding: '20px',
                                textAlign: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    color: colors.primary,
                                    fontSize: '36px',
                                    fontWeight: '800',
                                    margin: '0',
                                }}
                            >
                                {newMessages}
                            </Text>
                            <Text
                                style={{
                                    color: colors.textMuted,
                                    fontSize: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    margin: '4px 0 0',
                                }}
                            >
                                Unread Messages
                            </Text>
                        </td>
                        <td style={{ width: '12px' }}></td>
                        <td
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px',
                                padding: '20px',
                                textAlign: 'center',
                            }}
                        >
                            <Text
                                style={{
                                    color: colors.accent,
                                    fontSize: '36px',
                                    fontWeight: '800',
                                    margin: '0',
                                }}
                            >
                                {newContent}
                            </Text>
                            <Text
                                style={{
                                    color: colors.textMuted,
                                    fontSize: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    margin: '4px 0 0',
                                }}
                            >
                                New Posts
                            </Text>
                        </td>
                    </tr>
                </table>
            </Section>

            <Section
                style={{
                    background: `linear-gradient(135deg, ${colors.primaryGlow}, rgba(251, 191, 36, 0.15))`,
                    borderRadius: '16px',
                    padding: '24px',
                    margin: '24px 0',
                    textAlign: 'center',
                }}
            >
                <Text
                    style={{
                        color: colors.text,
                        fontSize: '18px',
                        fontWeight: '600',
                        margin: '0 0 8px',
                    }}
                >
                    Your community is waiting! 🔥
                </Text>
                <Text
                    style={{
                        color: colors.textMuted,
                        fontSize: '14px',
                        margin: 0,
                        lineHeight: '22px',
                    }}
                >
                    People have been posting, connecting, and having a great
                    time. Come back and join the fun!
                </Text>
            </Section>

            <PrimaryButton href="https://realkink.men/dashboard">
                Return to Real Kink Men
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
                Don't want these emails?{' '}
                <a
                    href="https://realkink.men/settings/notifications"
                    style={styles.link}
                >
                    Unsubscribe
                </a>
            </Text>
        </EmailWrapper>
    );
}


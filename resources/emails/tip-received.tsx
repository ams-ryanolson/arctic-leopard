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

interface TipReceivedEmailProps {
    creatorName: string;
    tipperName: string;
    tipperUsername: string;
    tipperAvatarUrl?: string;
    amount: string;
    message?: string;
    dashboardUrl: string;
}

export default function TipReceivedEmail({
    creatorName = 'Creator',
    tipperName = 'GenerousSub',
    tipperUsername = 'generoussub',
    tipperAvatarUrl = 'https://beta-cdn.realkink.men/emails/default-avatar.png',
    amount = '$25.00',
    message = 'Love your content! Keep it up! 🔥',
    dashboardUrl = 'https://realkink.men/creator/earnings',
}: TipReceivedEmailProps) {
    return (
        <EmailWrapper preview={`💰 ${tipperName} just tipped you ${amount}!`}>
            <Heading style={styles.heading}>You Got Tipped! 💰</Heading>
            <Text style={styles.subheading}>
                {tipperName} just showed their appreciation
            </Text>

            <Section
                style={{
                    background: `linear-gradient(135deg, ${colors.primaryGlow}, rgba(251, 191, 36, 0.2))`,
                    borderRadius: '20px',
                    padding: '32px',
                    margin: '24px 0',
                    textAlign: 'center',
                }}
            >
                <Text
                    style={{
                        color: colors.textMuted,
                        fontSize: '14px',
                        margin: '0 0 8px',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                    }}
                >
                    Tip Amount
                </Text>
                <Text
                    style={{
                        color: colors.accent,
                        fontSize: '48px',
                        fontWeight: '800',
                        margin: '0',
                        letterSpacing: '-2px',
                        textShadow: '0 4px 24px rgba(251, 191, 36, 0.4)',
                    }}
                >
                    {amount}
                </Text>
            </Section>

            <UserCard
                avatarUrl={tipperAvatarUrl}
                name={tipperName}
                username={tipperUsername}
            />

            {message && (
                <Section
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '20px',
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
                        }}
                    >
                        Their Message
                    </Text>
                    <Text
                        style={{
                            color: colors.text,
                            fontSize: '15px',
                            lineHeight: '24px',
                            margin: 0,
                            fontStyle: 'italic',
                        }}
                    >
                        "{message}"
                    </Text>
                </Section>
            )}

            <PrimaryButton href={dashboardUrl}>View Earnings</PrimaryButton>

            <Divider />

            <Section style={{ textAlign: 'center' }}>
                <Text
                    style={{
                        color: colors.textMuted,
                        fontSize: '13px',
                        margin: '0 0 16px',
                    }}
                >
                    Want to thank them personally?
                </Text>
                <SecondaryButton
                    href={`https://realkink.men/@${tipperUsername}`}
                >
                    Send a Thank You
                </SecondaryButton>
            </Section>
        </EmailWrapper>
    );
}


import { Heading, Section, Text } from '@react-email/components';
import * as React from 'react';

import {
    colors,
    Divider,
    EmailWrapper,
    PrimaryButton,
    styles,
    UserCard,
} from './components/shared';

interface MentionedEmailProps {
    recipientName: string;
    mentionerName: string;
    mentionerUsername: string;
    mentionerAvatarUrl?: string;
    context: string;
    postUrl: string;
}

export default function MentionedEmail({
    recipientName = 'Kinkster',
    mentionerName = 'LeatherDad42',
    mentionerUsername = 'leatherdad42',
    mentionerAvatarUrl = 'https://beta-cdn.realkink.men/emails/default-avatar.png',
    context = "Had an amazing time at the dungeon with @kinkster last night! Can't wait to do it again 🔥",
    postUrl = 'https://realkink.men/posts/abc123',
}: MentionedEmailProps) {
    return (
        <EmailWrapper
            preview={`${mentionerName} mentioned you on Real Kink Men`}
        >
            <Heading style={styles.heading}>You Were Mentioned 📢</Heading>
            <Text style={styles.subheading}>
                {mentionerName} tagged you in a post
            </Text>

            <UserCard
                avatarUrl={mentionerAvatarUrl}
                name={mentionerName}
                username={mentionerUsername}
            />

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
                        color: colors.text,
                        fontSize: '15px',
                        lineHeight: '24px',
                        margin: 0,
                    }}
                >
                    "{context}"
                </Text>
            </Section>

            <PrimaryButton href={postUrl}>View Post</PrimaryButton>

            <Divider />

            <Text
                style={{
                    ...styles.paragraph,
                    fontSize: '13px',
                    textAlign: 'center',
                    color: colors.textSubtle,
                    marginBottom: 0,
                }}
            >
                Join the conversation! 💬
            </Text>
        </EmailWrapper>
    );
}


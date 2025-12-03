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

interface NewMessageEmailProps {
    recipientName: string;
    senderName: string;
    senderUsername: string;
    senderAvatarUrl?: string;
    messagePreview: string;
    conversationUrl: string;
}

export default function NewMessageEmail({
    recipientName = 'Kinkster',
    senderName = 'LeatherDad42',
    senderUsername = 'leatherdad42',
    senderAvatarUrl = 'https://beta-cdn.realkink.men/emails/default-avatar.png',
    messagePreview = "Hey! I saw your profile and thought we'd really hit it off...",
    conversationUrl = 'https://realkink.men/messages/conversation-id',
}: NewMessageEmailProps) {
    return (
        <EmailWrapper
            preview={`New message from ${senderName}: "${messagePreview.slice(0, 40)}..."`}
        >
            <Heading style={styles.heading}>New Message 💬</Heading>
            <Text style={styles.subheading}>
                {senderName} sent you a message
            </Text>

            <UserCard
                avatarUrl={senderAvatarUrl}
                name={senderName}
                username={senderUsername}
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
                        fontStyle: 'italic',
                    }}
                >
                    "{messagePreview}"
                </Text>
            </Section>

            <PrimaryButton href={conversationUrl}>
                Reply to Message
            </PrimaryButton>

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
                You can also reply directly to this email to respond.
            </Text>
        </EmailWrapper>
    );
}


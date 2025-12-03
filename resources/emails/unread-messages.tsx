import { Heading, Img, Section, Text } from '@react-email/components';
import * as React from 'react';

import {
    colors,
    Divider,
    EmailWrapper,
    PrimaryButton,
    styles,
} from './components/shared';

interface UnreadMessagesEmailProps {
    username: string;
    unreadCount: number;
    messages: Array<{
        senderName: string;
        senderUsername: string;
        senderAvatarUrl: string;
        preview: string;
        sentAt: string;
        conversationUrl: string;
    }>;
}

export default function UnreadMessagesEmail({
    username = 'kinkster',
    unreadCount = 5,
    messages = [
        {
            senderName: 'LeatherDad42',
            senderUsername: 'leatherdad42',
            senderAvatarUrl: 'https://beta-cdn.realkink.men/emails/default-avatar.png',
            preview: "Hey! I saw your profile and thought we'd hit it off...",
            sentAt: '2 hours ago',
            conversationUrl: 'https://realkink.men/messages/conv1',
        },
        {
            senderName: 'RubberPup',
            senderUsername: 'rubberpup',
            senderAvatarUrl: 'https://beta-cdn.realkink.men/emails/default-avatar.png',
            preview: 'That photo from IML was amazing! Where did you get...',
            sentAt: '5 hours ago',
            conversationUrl: 'https://realkink.men/messages/conv2',
        },
    ],
}: UnreadMessagesEmailProps) {
    return (
        <EmailWrapper
            preview={`You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''} on Real Kink Men`}
        >
            <Heading style={styles.heading}>
                {unreadCount} Unread Message{unreadCount > 1 ? 's' : ''} 💬
            </Heading>
            <Text style={styles.subheading}>
                People are waiting to hear from you, {username}
            </Text>

            {messages.map((message, index) => (
                <Section
                    key={index}
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '16px',
                        padding: '20px',
                        margin: '16px 0',
                    }}
                >
                    <table style={{ width: '100%' }}>
                        <tr>
                            <td style={{ width: '56px', verticalAlign: 'top' }}>
                                <Img
                                    src={message.senderAvatarUrl}
                                    width={48}
                                    height={48}
                                    alt={message.senderName}
                                    style={{
                                        borderRadius: '50%',
                                        display: 'block',
                                    }}
                                />
                            </td>
                            <td style={{ verticalAlign: 'top' }}>
                                <Text
                                    style={{
                                        color: colors.text,
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        margin: '0 0 2px',
                                    }}
                                >
                                    {message.senderName}
                                </Text>
                                <Text
                                    style={{
                                        color: colors.textMuted,
                                        fontSize: '12px',
                                        margin: '0 0 8px',
                                    }}
                                >
                                    @{message.senderUsername} • {message.sentAt}
                                </Text>
                                <Text
                                    style={{
                                        color: colors.textMuted,
                                        fontSize: '14px',
                                        lineHeight: '20px',
                                        margin: '0 0 12px',
                                    }}
                                >
                                    {message.preview}
                                </Text>
                                <a
                                    href={message.conversationUrl}
                                    style={{
                                        color: colors.primary,
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        textDecoration: 'none',
                                    }}
                                >
                                    Reply →
                                </a>
                            </td>
                        </tr>
                    </table>
                </Section>
            ))}

            {unreadCount > messages.length && (
                <Text
                    style={{
                        color: colors.textMuted,
                        fontSize: '14px',
                        textAlign: 'center',
                        margin: '16px 0',
                    }}
                >
                    + {unreadCount - messages.length} more unread message
                    {unreadCount - messages.length > 1 ? 's' : ''}
                </Text>
            )}

            <PrimaryButton href="https://realkink.men/messages">
                View All Messages
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
                <a
                    href="https://realkink.men/settings/notifications"
                    style={styles.link}
                >
                    Manage notification settings
                </a>
            </Text>
        </EmailWrapper>
    );
}


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

interface PostCommentedEmailProps {
    recipientName: string;
    commenterName: string;
    commenterUsername: string;
    commenterAvatarUrl?: string;
    commentText: string;
    postPreview: string;
    postUrl: string;
}

export default function PostCommentedEmail({
    recipientName = 'Kinkster',
    commenterName = 'LeatherDad42',
    commenterUsername = 'leatherdad42',
    commenterAvatarUrl = 'https://beta-cdn.realkink.men/emails/default-avatar.png',
    commentText = 'This is incredible! Where did you get that harness? 🔥',
    postPreview = "Just got back from IML and it was incredible!",
    postUrl = 'https://realkink.men/posts/abc123',
}: PostCommentedEmailProps) {
    return (
        <EmailWrapper
            preview={`${commenterName} commented on your post: "${commentText.slice(0, 40)}..."`}
        >
            <Heading style={styles.heading}>New Comment 💬</Heading>
            <Text style={styles.subheading}>
                {commenterName} replied to your post
            </Text>

            <UserCard
                avatarUrl={commenterAvatarUrl}
                name={commenterName}
                username={commenterUsername}
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
                        color: colors.textMuted,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        margin: '0 0 8px',
                    }}
                >
                    Their Comment
                </Text>
                <Text
                    style={{
                        color: colors.text,
                        fontSize: '15px',
                        lineHeight: '24px',
                        margin: 0,
                    }}
                >
                    "{commentText}"
                </Text>
            </Section>

            <Section
                style={{
                    borderLeft: `2px solid ${colors.cardBorder}`,
                    paddingLeft: '16px',
                    margin: '24px 0',
                }}
            >
                <Text
                    style={{
                        color: colors.textSubtle,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        margin: '0 0 4px',
                    }}
                >
                    Your Post
                </Text>
                <Text
                    style={{
                        color: colors.textMuted,
                        fontSize: '13px',
                        lineHeight: '20px',
                        margin: 0,
                        fontStyle: 'italic',
                    }}
                >
                    {postPreview}
                </Text>
            </Section>

            <PrimaryButton href={postUrl}>Reply to Comment</PrimaryButton>

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
                Engage with your community! 🤝
            </Text>
        </EmailWrapper>
    );
}


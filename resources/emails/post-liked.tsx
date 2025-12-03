import { Heading, Img, Section, Text } from '@react-email/components';
import * as React from 'react';

import {
    colors,
    Divider,
    EmailWrapper,
    PrimaryButton,
    styles,
    UserCard,
} from './components/shared';

interface PostLikedEmailProps {
    recipientName: string;
    likerName: string;
    likerUsername: string;
    likerAvatarUrl?: string;
    postPreview?: string;
    postImageUrl?: string;
    postUrl: string;
    totalLikes: number;
}

export default function PostLikedEmail({
    recipientName = 'Kinkster',
    likerName = 'LeatherDad42',
    likerUsername = 'leatherdad42',
    likerAvatarUrl = 'https://beta-cdn.realkink.men/emails/default-avatar.png',
    postPreview = "Just got back from IML and it was incredible! Here's a shot from the main event...",
    postImageUrl,
    postUrl = 'https://realkink.men/posts/abc123',
    totalLikes = 42,
}: PostLikedEmailProps) {
    return (
        <EmailWrapper
            preview={`${likerName} liked your post on Real Kink Men`}
        >
            <Heading style={styles.heading}>Someone Liked Your Post ❤️</Heading>
            <Text style={styles.subheading}>
                {likerName} appreciated your content
            </Text>

            <UserCard
                avatarUrl={likerAvatarUrl}
                name={likerName}
                username={likerUsername}
            />

            <Section
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    margin: '24px 0',
                }}
            >
                {postImageUrl && (
                    <Img
                        src={postImageUrl}
                        alt="Post image"
                        width="100%"
                        style={{
                            display: 'block',
                            maxHeight: '200px',
                            objectFit: 'cover',
                        }}
                    />
                )}
                <Section style={{ padding: '16px 20px' }}>
                    <Text
                        style={{
                            color: colors.text,
                            fontSize: '14px',
                            lineHeight: '22px',
                            margin: 0,
                        }}
                    >
                        {postPreview}
                    </Text>
                    <Text
                        style={{
                            color: colors.primary,
                            fontSize: '13px',
                            fontWeight: '600',
                            margin: '12px 0 0',
                        }}
                    >
                        ❤️ {totalLikes} likes
                    </Text>
                </Section>
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
                Keep creating great content! 🔥
            </Text>
        </EmailWrapper>
    );
}


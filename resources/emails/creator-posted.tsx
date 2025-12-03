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

interface CreatorPostedEmailProps {
    subscriberName: string;
    creatorName: string;
    creatorUsername: string;
    creatorAvatarUrl?: string;
    postPreview: string;
    postImageUrl?: string;
    postUrl: string;
    isExclusive: boolean;
}

export default function CreatorPostedEmail({
    subscriberName = 'Kinkster',
    creatorName = 'MasterJohn',
    creatorUsername = 'masterjohn',
    creatorAvatarUrl = 'https://beta-cdn.realkink.men/emails/default-avatar.png',
    postPreview = 'Just finished an incredible session at the dungeon. Here are some behind-the-scenes shots...',
    postImageUrl,
    postUrl = 'https://realkink.men/posts/abc123',
    isExclusive = true,
}: CreatorPostedEmailProps) {
    return (
        <EmailWrapper
            preview={`${creatorName} just posted ${isExclusive ? 'exclusive content' : 'something new'}!`}
        >
            <Heading style={styles.heading}>
                {isExclusive ? '🔐 Exclusive Content' : '📸 New Post'}
            </Heading>
            <Text style={styles.subheading}>
                {creatorName} just shared something new
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
                    overflow: 'hidden',
                    margin: '24px 0',
                }}
            >
                {postImageUrl && (
                    <Img
                        src={postImageUrl}
                        alt="Post preview"
                        width="100%"
                        style={{
                            display: 'block',
                            maxHeight: '250px',
                            objectFit: 'cover',
                        }}
                    />
                )}
                <Section style={{ padding: '20px' }}>
                    {isExclusive && (
                        <Text
                            style={{
                                backgroundColor: colors.primaryGlow,
                                borderRadius: '6px',
                                color: colors.primaryLight,
                                display: 'inline-block',
                                fontSize: '11px',
                                fontWeight: '600',
                                letterSpacing: '0.5px',
                                padding: '4px 10px',
                                textTransform: 'uppercase',
                                margin: '0 0 12px',
                            }}
                        >
                            Subscriber Only
                        </Text>
                    )}
                    <Text
                        style={{
                            color: colors.text,
                            fontSize: '15px',
                            lineHeight: '24px',
                            margin: 0,
                        }}
                    >
                        {postPreview}
                    </Text>
                </Section>
            </Section>

            <PrimaryButton href={postUrl}>View Full Post</PrimaryButton>

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
                    Manage notification preferences
                </a>
            </Text>
        </EmailWrapper>
    );
}


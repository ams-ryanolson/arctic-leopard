import { Heading, Img, Section, Text } from '@react-email/components';
import * as React from 'react';

import {
    colors,
    Divider,
    EmailWrapper,
    PrimaryButton,
    SecondaryButton,
    styles,
} from './components/shared';

interface WeeklyDigestEmailProps {
    username: string;
    profileViews: number;
    newFollowers: number;
    newLikes: number;
    newMessages: number;
    topPosts?: Array<{
        preview: string;
        likes: number;
        comments: number;
        url: string;
    }>;
    suggestedUsers?: Array<{
        name: string;
        username: string;
        avatarUrl: string;
        profileUrl: string;
    }>;
}

export default function WeeklyDigestEmail({
    username = 'kinkster',
    profileViews = 142,
    newFollowers = 8,
    newLikes = 47,
    newMessages = 12,
    topPosts = [
        {
            preview: 'Just got back from IML and it was incredible!',
            likes: 23,
            comments: 5,
            url: 'https://realkink.men/posts/abc123',
        },
    ],
    suggestedUsers = [
        {
            name: 'LeatherDad42',
            username: 'leatherdad42',
            avatarUrl: 'https://beta-cdn.realkink.men/emails/default-avatar.png',
            profileUrl: 'https://realkink.men/@leatherdad42',
        },
    ],
}: WeeklyDigestEmailProps) {
    return (
        <EmailWrapper preview={`Your week on Real Kink Men: ${profileViews} profile views, ${newFollowers} new followers`}>
            <Heading style={styles.heading}>Your Weekly Recap 📊</Heading>
            <Text style={styles.subheading}>
                Here's what happened this week, {username}
            </Text>

            {/* Stats Grid */}
            <Section style={{ margin: '24px 0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                                    color: colors.primary,
                                    fontSize: '32px',
                                    fontWeight: '800',
                                    margin: '0',
                                }}
                            >
                                {profileViews}
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
                                Profile Views
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
                                    color: colors.success,
                                    fontSize: '32px',
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
                    </tr>
                    <tr>
                        <td colSpan={3} style={{ height: '12px' }}></td>
                    </tr>
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
                                    color: colors.accent,
                                    fontSize: '32px',
                                    fontWeight: '800',
                                    margin: '0',
                                }}
                            >
                                {newLikes}
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
                                Likes
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
                                    color: colors.text,
                                    fontSize: '32px',
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
                                Messages
                            </Text>
                        </td>
                    </tr>
                </table>
            </Section>

            {/* Top Posts */}
            {topPosts && topPosts.length > 0 && (
                <>
                    <Text
                        style={{
                            color: colors.textMuted,
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            margin: '32px 0 16px',
                        }}
                    >
                        Your Top Content
                    </Text>
                    {topPosts.map((post, index) => (
                        <Section
                            key={index}
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px',
                                padding: '16px',
                                margin: '0 0 12px',
                            }}
                        >
                            <Text
                                style={{
                                    color: colors.text,
                                    fontSize: '14px',
                                    lineHeight: '22px',
                                    margin: '0 0 8px',
                                }}
                            >
                                {post.preview}
                            </Text>
                            <Text
                                style={{
                                    color: colors.textMuted,
                                    fontSize: '13px',
                                    margin: 0,
                                }}
                            >
                                ❤️ {post.likes} likes • 💬 {post.comments} comments
                            </Text>
                        </Section>
                    ))}
                </>
            )}

            {/* Suggested Users */}
            {suggestedUsers && suggestedUsers.length > 0 && (
                <>
                    <Text
                        style={{
                            color: colors.textMuted,
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            margin: '32px 0 16px',
                        }}
                    >
                        People to Follow
                    </Text>
                    {suggestedUsers.map((user, index) => (
                        <Section
                            key={index}
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px',
                                padding: '16px',
                                margin: '0 0 12px',
                            }}
                        >
                            <table style={{ width: '100%' }}>
                                <tr>
                                    <td style={{ width: '48px' }}>
                                        <Img
                                            src={user.avatarUrl}
                                            width={40}
                                            height={40}
                                            alt={user.name}
                                            style={{
                                                borderRadius: '50%',
                                                display: 'block',
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <Text
                                            style={{
                                                color: colors.text,
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                margin: '0',
                                            }}
                                        >
                                            {user.name}
                                        </Text>
                                        <Text
                                            style={{
                                                color: colors.textMuted,
                                                fontSize: '13px',
                                                margin: '2px 0 0',
                                            }}
                                        >
                                            @{user.username}
                                        </Text>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <a
                                            href={user.profileUrl}
                                            style={{
                                                ...styles.buttonSecondary,
                                                padding: '8px 16px',
                                                fontSize: '12px',
                                            }}
                                        >
                                            View
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </Section>
                    ))}
                </>
            )}

            <PrimaryButton href="https://realkink.men/dashboard">
                Open Real Kink Men
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
                    Unsubscribe from weekly digest
                </a>
            </Text>
        </EmailWrapper>
    );
}


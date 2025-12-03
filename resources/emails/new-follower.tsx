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

interface NewFollowerEmailProps {
    recipientName: string;
    followerName: string;
    followerUsername: string;
    followerAvatarUrl?: string;
    followerBio?: string;
    profileUrl: string;
}

export default function NewFollowerEmail({
    recipientName = 'Kinkster',
    followerName = 'LeatherDad42',
    followerUsername = 'leatherdad42',
    followerAvatarUrl = 'https://beta-cdn.realkink.men/emails/default-avatar.png',
    followerBio = 'Leather enthusiast. Dom. Looking to connect with like-minded men.',
    profileUrl = 'https://realkink.men/@leatherdad42',
}: NewFollowerEmailProps) {
    return (
        <EmailWrapper
            preview={`${followerName} is now following you on Real Kink Men`}
        >
            <Heading style={styles.heading}>You Have a New Follower! 🔥</Heading>
            <Text style={styles.subheading}>
                {followerName} wants to see more of your content
            </Text>

            <UserCard
                avatarUrl={followerAvatarUrl}
                name={followerName}
                username={followerUsername}
            />

            {followerBio && (
                <Text
                    style={{
                        ...styles.paragraph,
                        fontSize: '14px',
                        textAlign: 'center',
                        fontStyle: 'italic',
                        color: colors.textSubtle,
                    }}
                >
                    "{followerBio}"
                </Text>
            )}

            <PrimaryButton href={profileUrl}>View Their Profile</PrimaryButton>

            <Divider />

            <Section style={{ textAlign: 'center' }}>
                <Text
                    style={{
                        color: colors.textMuted,
                        fontSize: '13px',
                        margin: '0 0 16px',
                    }}
                >
                    Want to grow your following too?
                </Text>
                <SecondaryButton href="https://realkink.men/dashboard">
                    Post Something New
                </SecondaryButton>
            </Section>
        </EmailWrapper>
    );
}


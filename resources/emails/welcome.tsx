import { Heading, Text } from '@react-email/components';
import * as React from 'react';

import {
    colors,
    Divider,
    EmailWrapper,
    HighlightBox,
    PrimaryButton,
    styles,
} from './components/shared';

interface WelcomeEmailProps {
    username: string;
    displayName?: string;
}

export default function WelcomeEmail({
    username = 'kinkster',
    displayName = 'Kinkster',
}: WelcomeEmailProps) {
    return (
        <EmailWrapper preview={`Welcome to Real Kink Men, ${displayName}! 🔥`}>
            <Heading style={styles.heading}>Welcome to the Community</Heading>
            <Text style={styles.subheading}>
                We're thrilled to have you here, {displayName}
            </Text>

            <Text style={styles.paragraph}>
                You've just joined a community of like-minded individuals who
                celebrate authenticity and connection. Real Kink Men is your
                space to be yourself, make genuine connections, and explore
                without judgment.
            </Text>

            <HighlightBox>
                <Text
                    style={{
                        color: colors.text,
                        fontSize: '14px',
                        margin: 0,
                        lineHeight: '22px',
                    }}
                >
                    <strong>Quick tip:</strong> Complete your profile to get 3x
                    more profile views. Add a photo, write your bio, and let
                    others know what you're into.
                </Text>
            </HighlightBox>

            <PrimaryButton href="https://realkink.men/dashboard">
                Complete Your Profile
            </PrimaryButton>

            <Divider />

            <Text
                style={{
                    ...styles.paragraph,
                    fontSize: '14px',
                    textAlign: 'center',
                    marginBottom: 0,
                }}
            >
                Questions? Just reply to this email—we're here to help.
            </Text>
        </EmailWrapper>
    );
}


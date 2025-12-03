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

interface AccountReactivatedEmailProps {
    username: string;
}

export default function AccountReactivatedEmail({
    username = 'kinkster',
}: AccountReactivatedEmailProps) {
    return (
        <EmailWrapper preview="Your Real Kink Men account has been reactivated!">
            <Heading style={styles.heading}>Welcome Back! 🎉</Heading>
            <Text style={styles.subheading}>
                Your account has been reactivated
            </Text>

            <Text style={styles.paragraph}>
                Hey {username}, great news! After reviewing your appeal, we've
                decided to reactivate your account. You now have full access to
                Real Kink Men again.
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
                    <strong>📋 Reminder:</strong> Please review our community
                    guidelines to ensure your account stays in good standing.
                    We're here to help you have a great experience!
                </Text>
            </HighlightBox>

            <PrimaryButton href="https://realkink.men/dashboard">
                Return to Real Kink Men
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
                Questions?{' '}
                <a href="mailto:support@realkink.men" style={styles.link}>
                    Contact Support
                </a>
            </Text>
        </EmailWrapper>
    );
}


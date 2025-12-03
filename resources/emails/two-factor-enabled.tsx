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

interface TwoFactorEnabledEmailProps {
    username: string;
    enabledAt: string;
}

export default function TwoFactorEnabledEmail({
    username = 'kinkster',
    enabledAt = 'December 3, 2025 at 3:45 PM EST',
}: TwoFactorEnabledEmailProps) {
    return (
        <EmailWrapper preview="Two-factor authentication enabled on your account">
            <Heading style={styles.heading}>2FA Enabled ✅</Heading>
            <Text style={styles.subheading}>
                Your account is now extra secure
            </Text>

            <Text style={styles.paragraph}>
                Great news, {username}! Two-factor authentication has been
                successfully enabled on your account. You'll now need to enter a
                verification code when logging in.
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
                    <strong>🔑 Important:</strong> Make sure you've saved your
                    recovery codes in a safe place. You'll need them if you lose
                    access to your authenticator app.
                </Text>
            </HighlightBox>

            <PrimaryButton href="https://realkink.men/settings/security">
                View Security Settings
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
                Enabled on {enabledAt}
            </Text>
        </EmailWrapper>
    );
}


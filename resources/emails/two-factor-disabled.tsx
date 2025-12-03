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

interface TwoFactorDisabledEmailProps {
    username: string;
    disabledAt: string;
}

export default function TwoFactorDisabledEmail({
    username = 'kinkster',
    disabledAt = 'December 3, 2025 at 3:45 PM EST',
}: TwoFactorDisabledEmailProps) {
    return (
        <EmailWrapper preview="Two-factor authentication disabled on your account">
            <Heading style={styles.heading}>2FA Disabled ⚠️</Heading>
            <Text style={styles.subheading}>
                Your account security has been reduced
            </Text>

            <Text style={styles.paragraph}>
                Hey {username}, two-factor authentication has been disabled on
                your account. Your account is now only protected by your
                password.
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
                    <strong>⚠️ Wasn't you?</strong> If you didn't disable 2FA,
                    your account may be compromised. Re-enable it immediately
                    and change your password.
                </Text>
            </HighlightBox>

            <PrimaryButton href="https://realkink.men/settings/security">
                Re-enable 2FA
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
                Disabled on {disabledAt}
            </Text>
        </EmailWrapper>
    );
}


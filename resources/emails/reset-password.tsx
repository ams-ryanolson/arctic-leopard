import { Heading, Link, Text } from '@react-email/components';
import * as React from 'react';

import {
    colors,
    Divider,
    EmailWrapper,
    HighlightBox,
    PrimaryButton,
    styles,
} from './components/shared';

interface ResetPasswordProps {
    username: string;
    resetUrl: string;
}

export default function ResetPassword({
    username = 'kinkster',
    resetUrl = 'https://realkink.men/reset-password/token',
}: ResetPasswordProps) {
    return (
        <EmailWrapper preview="Reset your Real Kink Men password">
            <Heading style={styles.heading}>Reset Your Password</Heading>
            <Text style={styles.subheading}>
                We received a request to reset your password
            </Text>

            <Text style={styles.paragraph}>
                Hey {username}, someone (hopefully you) requested a password
                reset for your Real Kink Men account. Click the button below to
                create a new password.
            </Text>

            <PrimaryButton href={resetUrl}>Reset Password</PrimaryButton>

            <HighlightBox>
                <Text
                    style={{
                        color: colors.text,
                        fontSize: '14px',
                        margin: 0,
                        lineHeight: '22px',
                    }}
                >
                    <strong>⏰ This link expires in 60 minutes</strong> for your
                    security. If it expires, you can request a new one.
                </Text>
            </HighlightBox>

            <Text
                style={{
                    ...styles.paragraph,
                    fontSize: '13px',
                    textAlign: 'center',
                    color: colors.textSubtle,
                }}
            >
                If you didn't request this, you can safely ignore this email.
                Your password won't change until you click the link above.
            </Text>

            <Divider />

            <Text
                style={{
                    ...styles.paragraph,
                    fontSize: '12px',
                    color: colors.textSubtle,
                    marginBottom: 0,
                }}
            >
                Button not working? Copy and paste this link:
                <br />
                <Link href={resetUrl} style={styles.link}>
                    {resetUrl}
                </Link>
            </Text>
        </EmailWrapper>
    );
}


import { Heading, Link, Text } from '@react-email/components';
import * as React from 'react';

import {
    colors,
    Divider,
    EmailWrapper,
    PrimaryButton,
    styles,
} from './components/shared';

interface VerifyEmailProps {
    username: string;
    verificationUrl: string;
}

export default function VerifyEmail({
    username = 'kinkster',
    verificationUrl = 'https://realkink.men/verify-email/token',
}: VerifyEmailProps) {
    return (
        <EmailWrapper preview="Verify your email to get started on Real Kink Men">
            <Heading style={styles.heading}>Verify Your Email</Heading>
            <Text style={styles.subheading}>
                One quick step to unlock everything
            </Text>

            <Text style={styles.paragraph}>
                Hey {username}, thanks for signing up! Click the button below to
                verify your email address and unlock all features of your
                account.
            </Text>

            <PrimaryButton href={verificationUrl}>
                Verify Email Address
            </PrimaryButton>

            <Text
                style={{
                    ...styles.paragraph,
                    fontSize: '13px',
                    textAlign: 'center',
                    color: colors.textSubtle,
                }}
            >
                This link expires in 24 hours. If you didn't create an account,
                you can safely ignore this email.
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
                <Link href={verificationUrl} style={styles.link}>
                    {verificationUrl}
                </Link>
            </Text>
        </EmailWrapper>
    );
}


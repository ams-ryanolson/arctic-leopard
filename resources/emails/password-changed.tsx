import { Heading, Section, Text } from '@react-email/components';
import * as React from 'react';

import {
    colors,
    Divider,
    EmailWrapper,
    HighlightBox,
    PrimaryButton,
    styles,
} from './components/shared';

interface PasswordChangedEmailProps {
    username: string;
    changedAt: string;
    ipAddress: string;
    location?: string;
}

export default function PasswordChangedEmail({
    username = 'kinkster',
    changedAt = 'December 3, 2025 at 3:45 PM EST',
    ipAddress = '192.168.1.1',
    location = 'Toronto, Canada',
}: PasswordChangedEmailProps) {
    return (
        <EmailWrapper preview="Your Real Kink Men password was changed">
            <Heading style={styles.heading}>Password Changed 🔐</Heading>
            <Text style={styles.subheading}>
                Your account password was successfully updated
            </Text>

            <Text style={styles.paragraph}>
                Hey {username}, we wanted to let you know that your password was
                just changed. If this was you, no action is needed.
            </Text>

            <Section
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '20px',
                    margin: '24px 0',
                }}
            >
                <table style={{ width: '100%' }}>
                    <tr>
                        <td
                            style={{
                                color: colors.textMuted,
                                fontSize: '13px',
                                padding: '8px 0',
                            }}
                        >
                            When:
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '13px',
                                padding: '8px 0',
                                textAlign: 'right',
                            }}
                        >
                            {changedAt}
                        </td>
                    </tr>
                    <tr>
                        <td
                            style={{
                                color: colors.textMuted,
                                fontSize: '13px',
                                padding: '8px 0',
                            }}
                        >
                            IP Address:
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '13px',
                                padding: '8px 0',
                                textAlign: 'right',
                                fontFamily: 'monospace',
                            }}
                        >
                            {ipAddress}
                        </td>
                    </tr>
                    {location && (
                        <tr>
                            <td
                                style={{
                                    color: colors.textMuted,
                                    fontSize: '13px',
                                    padding: '8px 0',
                                }}
                            >
                                Location:
                            </td>
                            <td
                                style={{
                                    color: colors.text,
                                    fontSize: '13px',
                                    padding: '8px 0',
                                    textAlign: 'right',
                                }}
                            >
                                {location}
                            </td>
                        </tr>
                    )}
                </table>
            </Section>

            <HighlightBox>
                <Text
                    style={{
                        color: colors.text,
                        fontSize: '14px',
                        margin: 0,
                        lineHeight: '22px',
                    }}
                >
                    <strong>⚠️ Wasn't you?</strong> If you didn't make this
                    change, your account may be compromised. Reset your password
                    immediately and contact support.
                </Text>
            </HighlightBox>

            <PrimaryButton href="https://realkink.men/forgot-password">
                Reset Password
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
                Need help?{' '}
                <a href="mailto:support@realkink.men" style={styles.link}>
                    Contact Support
                </a>
            </Text>
        </EmailWrapper>
    );
}


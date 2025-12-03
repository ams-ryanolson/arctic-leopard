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

interface LoginNewDeviceEmailProps {
    username: string;
    device: string;
    browser: string;
    ipAddress: string;
    location?: string;
    loginTime: string;
}

export default function LoginNewDeviceEmail({
    username = 'kinkster',
    device = 'MacBook Pro',
    browser = 'Safari 17.0',
    ipAddress = '192.168.1.1',
    location = 'Toronto, Canada',
    loginTime = 'December 3, 2025 at 3:45 PM EST',
}: LoginNewDeviceEmailProps) {
    return (
        <EmailWrapper preview="New login to your Real Kink Men account">
            <Heading style={styles.heading}>New Login Detected 🔔</Heading>
            <Text style={styles.subheading}>
                We noticed a login from a new device
            </Text>

            <Text style={styles.paragraph}>
                Hey {username}, your account was just accessed from a device we
                don't recognize. If this was you, you can ignore this email.
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
                            Device:
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '13px',
                                padding: '8px 0',
                                textAlign: 'right',
                            }}
                        >
                            {device}
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
                            Browser:
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '13px',
                                padding: '8px 0',
                                textAlign: 'right',
                            }}
                        >
                            {browser}
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
                    <tr>
                        <td
                            style={{
                                color: colors.textMuted,
                                fontSize: '13px',
                                padding: '8px 0',
                            }}
                        >
                            Time:
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '13px',
                                padding: '8px 0',
                                textAlign: 'right',
                            }}
                        >
                            {loginTime}
                        </td>
                    </tr>
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
                    <strong>⚠️ Wasn't you?</strong> Secure your account
                    immediately by changing your password and enabling
                    two-factor authentication.
                </Text>
            </HighlightBox>

            <PrimaryButton href="https://realkink.men/settings/security">
                Secure My Account
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
                You can manage trusted devices in{' '}
                <a
                    href="https://realkink.men/settings/sessions"
                    style={styles.link}
                >
                    Settings → Sessions
                </a>
            </Text>
        </EmailWrapper>
    );
}


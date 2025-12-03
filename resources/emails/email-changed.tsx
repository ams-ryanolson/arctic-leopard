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

interface EmailChangedEmailProps {
    username: string;
    oldEmail: string;
    newEmail: string;
    changedAt: string;
}

export default function EmailChangedEmail({
    username = 'kinkster',
    oldEmail = 'old@example.com',
    newEmail = 'new@example.com',
    changedAt = 'December 3, 2025 at 3:45 PM EST',
}: EmailChangedEmailProps) {
    return (
        <EmailWrapper preview="Your Real Kink Men email address was changed">
            <Heading style={styles.heading}>Email Address Changed 📧</Heading>
            <Text style={styles.subheading}>
                Your account email was successfully updated
            </Text>

            <Text style={styles.paragraph}>
                Hey {username}, we're confirming that the email address
                associated with your Real Kink Men account has been changed.
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
                            Previous email:
                        </td>
                        <td
                            style={{
                                color: colors.textSubtle,
                                fontSize: '13px',
                                padding: '8px 0',
                                textAlign: 'right',
                                textDecoration: 'line-through',
                            }}
                        >
                            {oldEmail}
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
                            New email:
                        </td>
                        <td
                            style={{
                                color: colors.success,
                                fontSize: '13px',
                                padding: '8px 0',
                                textAlign: 'right',
                                fontWeight: '600',
                            }}
                        >
                            {newEmail}
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
                            Changed:
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
                    change, your account may be compromised. Contact support
                    immediately.
                </Text>
            </HighlightBox>

            <PrimaryButton href="mailto:support@realkink.men">
                Contact Support
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
                This notification was sent to both your old and new email
                addresses for security.
            </Text>
        </EmailWrapper>
    );
}


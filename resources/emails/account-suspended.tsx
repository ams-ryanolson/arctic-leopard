import { Heading, Section, Text } from '@react-email/components';
import * as React from 'react';

import {
    colors,
    Divider,
    EmailWrapper,
    PrimaryButton,
    styles,
} from './components/shared';

interface AccountSuspendedEmailProps {
    username: string;
    reason: string;
    suspensionType: 'temporary' | 'permanent';
    expiresAt?: string;
    appealUrl: string;
}

export default function AccountSuspendedEmail({
    username = 'kinkster',
    reason = 'Violation of community guidelines regarding harassment.',
    suspensionType = 'temporary',
    expiresAt = 'December 10, 2025',
    appealUrl = 'https://realkink.men/appeal',
}: AccountSuspendedEmailProps) {
    const isTemporary = suspensionType === 'temporary';

    return (
        <EmailWrapper
            preview={`Your Real Kink Men account has been ${isTemporary ? 'temporarily ' : ''}suspended`}
        >
            <Heading style={styles.heading}>
                Account {isTemporary ? 'Temporarily ' : ''}Suspended
            </Heading>
            <Text style={styles.subheading}>
                {isTemporary
                    ? 'Your access has been restricted'
                    : 'Your account has been permanently suspended'}
            </Text>

            <Text style={styles.paragraph}>
                Hey {username}, after reviewing your account activity, we've
                determined that your account has violated our community
                guidelines.
            </Text>

            <Section
                style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderLeft: '3px solid #ef4444',
                    borderRadius: '0 8px 8px 0',
                    padding: '16px 20px',
                    margin: '24px 0',
                }}
            >
                <Text
                    style={{
                        color: colors.textMuted,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        margin: '0 0 8px',
                    }}
                >
                    Reason for Suspension
                </Text>
                <Text
                    style={{
                        color: colors.text,
                        fontSize: '14px',
                        lineHeight: '22px',
                        margin: 0,
                    }}
                >
                    {reason}
                </Text>
            </Section>

            {isTemporary && expiresAt && (
                <Section
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '20px',
                        margin: '24px 0',
                        textAlign: 'center',
                    }}
                >
                    <Text
                        style={{
                            color: colors.textMuted,
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            margin: '0 0 4px',
                        }}
                    >
                        Suspension Ends
                    </Text>
                    <Text
                        style={{
                            color: colors.text,
                            fontSize: '18px',
                            fontWeight: '600',
                            margin: 0,
                        }}
                    >
                        {expiresAt}
                    </Text>
                </Section>
            )}

            <Text style={styles.paragraph}>
                If you believe this was a mistake, you can submit an appeal and
                our team will review your case.
            </Text>

            <PrimaryButton href={appealUrl}>Submit an Appeal</PrimaryButton>

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
                Please review our{' '}
                <a
                    href="https://realkink.men/community-guidelines"
                    style={styles.link}
                >
                    Community Guidelines
                </a>{' '}
                to understand our policies.
            </Text>
        </EmailWrapper>
    );
}


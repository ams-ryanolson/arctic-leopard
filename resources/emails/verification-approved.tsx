import { Heading, Section, Text } from '@react-email/components';
import * as React from 'react';

import {
    colors,
    Divider,
    EmailWrapper,
    PrimaryButton,
    styles,
} from './components/shared';

interface VerificationApprovedEmailProps {
    username: string;
    verificationType: 'identity' | 'creator';
}

export default function VerificationApprovedEmail({
    username = 'kinkster',
    verificationType = 'identity',
}: VerificationApprovedEmailProps) {
    const isCreator = verificationType === 'creator';

    return (
        <EmailWrapper
            preview={`Congratulations! Your ${isCreator ? 'creator' : 'identity'} verification is approved! ✓`}
        >
            <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
                <Text
                    style={{
                        fontSize: '64px',
                        margin: 0,
                    }}
                >
                    ✓
                </Text>
            </Section>

            <Heading style={styles.heading}>
                {isCreator ? 'Creator Status' : 'Identity'} Verified! 🎉
            </Heading>
            <Text style={styles.subheading}>
                Congratulations, {username}!
            </Text>

            <Text style={styles.paragraph}>
                {isCreator
                    ? "Great news! Your creator application has been approved. You can now start monetizing your content, receive tips, and build your subscriber base."
                    : "Your identity has been successfully verified. You now have a verified badge on your profile, giving you more credibility in the community."}
            </Text>

            <Section
                style={{
                    background: `linear-gradient(135deg, ${colors.primaryGlow}, rgba(16, 185, 129, 0.2))`,
                    borderRadius: '16px',
                    padding: '24px',
                    margin: '24px 0',
                }}
            >
                <Text
                    style={{
                        color: colors.text,
                        fontSize: '14px',
                        margin: 0,
                        lineHeight: '26px',
                    }}
                >
                    {isCreator ? (
                        <>
                            <strong>What you can do now:</strong>
                            <br />
                            ✓ Set up subscription tiers
                            <br />
                            ✓ Receive tips from fans
                            <br />
                            ✓ Create pay-per-view content
                            <br />
                            ✓ Add items to your wishlist
                            <br />✓ Access creator analytics
                        </>
                    ) : (
                        <>
                            <strong>Your verified status includes:</strong>
                            <br />
                            ✓ Verified badge on your profile
                            <br />
                            ✓ Higher visibility in search
                            <br />
                            ✓ Increased trust from other members
                            <br />✓ Access to verified-only features
                        </>
                    )}
                </Text>
            </Section>

            <PrimaryButton
                href={
                    isCreator
                        ? 'https://realkink.men/creator/setup'
                        : 'https://realkink.men/settings/profile'
                }
            >
                {isCreator ? 'Set Up Creator Profile' : 'View Your Profile'}
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


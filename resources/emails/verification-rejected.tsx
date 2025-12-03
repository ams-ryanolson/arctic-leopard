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

interface VerificationRejectedEmailProps {
    username: string;
    verificationType: 'identity' | 'creator';
    reason: string;
    canReapply: boolean;
}

export default function VerificationRejectedEmail({
    username = 'kinkster',
    verificationType = 'identity',
    reason = 'The submitted documents were unclear or did not match the information on your profile.',
    canReapply = true,
}: VerificationRejectedEmailProps) {
    const isCreator = verificationType === 'creator';

    return (
        <EmailWrapper
            preview={`Your ${isCreator ? 'creator' : 'identity'} verification was not approved`}
        >
            <Heading style={styles.heading}>
                Verification Not Approved
            </Heading>
            <Text style={styles.subheading}>
                We couldn't verify your {isCreator ? 'creator application' : 'identity'}
            </Text>

            <Text style={styles.paragraph}>
                Hey {username}, we've reviewed your verification submission, but
                unfortunately we weren't able to approve it at this time.
            </Text>

            <Section
                style={{
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    borderLeft: '3px solid #fbbf24',
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
                    Reason
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

            {canReapply && (
                <>
                    <HighlightBox>
                        <Text
                            style={{
                                color: colors.text,
                                fontSize: '14px',
                                margin: 0,
                                lineHeight: '22px',
                            }}
                        >
                            <strong>Tips for reapplying:</strong>
                            <br />
                            • Ensure documents are clear and readable
                            <br />
                            • Make sure your face is clearly visible
                            <br />
                            • Use good lighting when taking photos
                            <br />• Check that all information matches your profile
                        </Text>
                    </HighlightBox>

                    <PrimaryButton href="https://realkink.men/settings/verification">
                        Try Again
                    </PrimaryButton>
                </>
            )}

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
                Have questions?{' '}
                <a href="mailto:support@realkink.men" style={styles.link}>
                    Contact Support
                </a>
            </Text>
        </EmailWrapper>
    );
}


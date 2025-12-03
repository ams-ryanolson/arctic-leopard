import { Heading, Section, Text } from '@react-email/components';
import * as React from 'react';

import {
    colors,
    Divider,
    EmailWrapper,
    PrimaryButton,
    styles,
} from './components/shared';

interface ContentRemovedEmailProps {
    username: string;
    contentType: 'post' | 'comment' | 'message' | 'profile';
    reason: string;
    contentPreview?: string;
    removedAt: string;
    appealUrl: string;
}

export default function ContentRemovedEmail({
    username = 'kinkster',
    contentType = 'post',
    reason = 'Violation of community guidelines: Content depicting non-consensual activity.',
    contentPreview = 'This content has been removed and is no longer visible.',
    removedAt = 'December 3, 2025',
    appealUrl = 'https://realkink.men/appeal',
}: ContentRemovedEmailProps) {
    const contentTypeLabels = {
        post: 'Post',
        comment: 'Comment',
        message: 'Message',
        profile: 'Profile content',
    };

    return (
        <EmailWrapper
            preview={`Your ${contentTypeLabels[contentType].toLowerCase()} was removed from Real Kink Men`}
        >
            <Heading style={styles.heading}>Content Removed</Heading>
            <Text style={styles.subheading}>
                Your {contentTypeLabels[contentType].toLowerCase()} violated our
                guidelines
            </Text>

            <Text style={styles.paragraph}>
                Hey {username}, after reviewing your content, we've determined
                that it violates our community guidelines and has been removed.
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
                    Reason for Removal
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

            <Section
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    margin: '24px 0',
                }}
            >
                <table style={{ width: '100%' }}>
                    <tr>
                        <td
                            style={{
                                color: colors.textMuted,
                                fontSize: '13px',
                                padding: '4px 0',
                            }}
                        >
                            Content type:
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '13px',
                                padding: '4px 0',
                                textAlign: 'right',
                            }}
                        >
                            {contentTypeLabels[contentType]}
                        </td>
                    </tr>
                    <tr>
                        <td
                            style={{
                                color: colors.textMuted,
                                fontSize: '13px',
                                padding: '4px 0',
                            }}
                        >
                            Removed on:
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '13px',
                                padding: '4px 0',
                                textAlign: 'right',
                            }}
                        >
                            {removedAt}
                        </td>
                    </tr>
                </table>
            </Section>

            <Text style={styles.paragraph}>
                If you believe this was a mistake, you can submit an appeal. Our
                team will review your case and get back to you.
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
                to avoid future issues.
            </Text>
        </EmailWrapper>
    );
}


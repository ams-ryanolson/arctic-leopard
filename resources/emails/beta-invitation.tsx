import { Heading, Text, Hr } from '@react-email/components';
import * as React from 'react';

import {
    colors,
    Divider,
    EmailWrapper,
    HighlightBox,
    PrimaryButton,
    SecondaryButton,
    Badge,
    styles,
} from './components/shared';

interface BetaInvitationEmailProps {
    username: string;
    displayName: string;
    resetPasswordUrl: string;
}

export default function BetaInvitationEmail({
    username = 'kinkster',
    displayName = 'Kinkster',
    resetPasswordUrl = 'https://realkink.men/forgot-password',
}: BetaInvitationEmailProps) {
    return (
        <EmailWrapper preview={`${displayName}, you're invited to the new Real Kink Men! 🎉`}>
            {/* VIP Badge */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <Badge>EXCLUSIVE BETA ACCESS</Badge>
            </div>

            <Heading style={styles.heading}>
                Welcome Back, {displayName}!
            </Heading>
            
            <Text style={{ ...styles.subheading, marginBottom: '24px' }}>
                You've been selected for early access to the completely redesigned Real Kink Men.
            </Text>

            <Text style={styles.paragraph}>
                We've rebuilt everything from the ground up — faster, sleeker, and packed with 
                features you've been asking for. As one of our valued members, you get to 
                experience it first.
            </Text>

            {/* Features Grid */}
            <div style={{ margin: '32px 0' }}>
                <Text style={{ 
                    color: colors.primary, 
                    fontSize: '14px', 
                    fontWeight: '600',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '1px',
                    marginBottom: '16px'
                }}>
                    What's New
                </Text>

                <HighlightBox>
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '8px 0', borderBottom: `1px solid ${colors.border}` }}>
                                    <Text style={{ color: colors.text, fontSize: '14px', margin: 0 }}>
                                        <strong style={{ color: colors.primary }}>⚡ Lightning Fast</strong>
                                        <br />
                                        <span style={{ color: colors.mutedForeground }}>
                                            Completely rebuilt for speed. No more waiting.
                                        </span>
                                    </Text>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px 0', borderBottom: `1px solid ${colors.border}` }}>
                                    <Text style={{ color: colors.text, fontSize: '14px', margin: 0 }}>
                                        <strong style={{ color: colors.primary }}>📱 Mobile First</strong>
                                        <br />
                                        <span style={{ color: colors.mutedForeground }}>
                                            Beautiful on every device. Take us anywhere.
                                        </span>
                                    </Text>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px 0', borderBottom: `1px solid ${colors.border}` }}>
                                    <Text style={{ color: colors.text, fontSize: '14px', margin: 0 }}>
                                        <strong style={{ color: colors.primary }}>💬 Real-Time Messaging</strong>
                                        <br />
                                        <span style={{ color: colors.mutedForeground }}>
                                            Instant messages. See when they're typing.
                                        </span>
                                    </Text>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px 0', borderBottom: `1px solid ${colors.border}` }}>
                                    <Text style={{ color: colors.text, fontSize: '14px', margin: 0 }}>
                                        <strong style={{ color: colors.primary }}>🔒 Enhanced Privacy</strong>
                                        <br />
                                        <span style={{ color: colors.mutedForeground }}>
                                            More control over who sees what.
                                        </span>
                                    </Text>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px 0' }}>
                                    <Text style={{ color: colors.text, fontSize: '14px', margin: 0 }}>
                                        <strong style={{ color: colors.primary }}>✨ Creator Tools</strong>
                                        {' '}
                                        <span style={{ 
                                            fontSize: '10px', 
                                            fontWeight: '600',
                                            color: colors.background,
                                            background: colors.primary,
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            textTransform: 'uppercase' as const,
                                            letterSpacing: '0.5px'
                                        }}>
                                            Coming Soon
                                        </span>
                                        <br />
                                        <span style={{ color: colors.mutedForeground }}>
                                            Subscriptions, tips, and premium content.
                                        </span>
                                    </Text>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </HighlightBox>
            </div>

            {/* Coming Soon Notice */}
            <div style={{ 
                background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '32px'
            }}>
                <Text style={{ color: colors.text, fontSize: '14px', margin: 0 }}>
                    <strong>🎥 Video Chat — Coming Soon</strong>
                    <br />
                    <span style={{ color: colors.mutedForeground }}>
                        We're putting the finishing touches on video chat. You'll be the first to know when it's ready!
                    </span>
                </Text>
            </div>

            {/* Important Notice */}
            <Text style={{ ...styles.paragraph, marginBottom: '8px' }}>
                <strong>Important:</strong> Since this is a brand new platform, you'll need to set a new password 
                to access your account. Your username <strong style={{ color: colors.primary }}>@{username}</strong> has 
                been reserved for you.
            </Text>

            <HighlightBox>
                <Text style={{ color: colors.text, fontSize: '14px', margin: 0, marginBottom: '8px' }}>
                    ✅ Don't worry — your profile info has been migrated. Just set your password and you're in.
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: '13px', margin: 0 }}>
                    📦 Your images, videos, and memberships will be migrated soon.
                </Text>
            </HighlightBox>

            <PrimaryButton href={resetPasswordUrl}>
                Set Your Password & Join the Beta
            </PrimaryButton>

            <Divider />

            {/* Feedback CTA */}
            <div style={{ 
                background: `linear-gradient(135deg, ${colors.muted} 0%, rgba(38, 38, 38, 0.5) 100%)`,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                marginBottom: '24px'
            }}>
                <Text style={{ color: colors.text, fontSize: '15px', margin: 0, marginBottom: '8px', fontWeight: '600' }}>
                    💬 We Want Your Feedback!
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: '13px', margin: 0 }}>
                    This is a beta — your input shapes what we build next.
                    <br />
                    Email me directly at{' '}
                    <a href="mailto:ryan@arcticmedia.io" style={{ color: colors.primary, textDecoration: 'none' }}>
                        ryan@arcticmedia.io
                    </a>
                </Text>
            </div>

            {/* Footer note */}
            <Text style={{ 
                ...styles.paragraph, 
                fontSize: '13px', 
                textAlign: 'center',
                color: colors.mutedForeground,
                marginBottom: 0 
            }}>
                <span style={{ color: colors.primary }}>— Ryan & The Real Kink Men Team</span>
            </Text>
        </EmailWrapper>
    );
}


import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';

// Brand colors
export const colors = {
    background: '#0a0a0a',
    cardBackground: '#141414',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    primary: '#f43f5e', // rose-500
    primaryLight: '#fb7185', // rose-400
    primaryGlow: 'rgba(244, 63, 94, 0.3)',
    text: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.7)',
    textSubtle: 'rgba(255, 255, 255, 0.5)',
    accent: '#fbbf24', // amber-400
    success: '#10b981', // emerald-500
    link: '#f43f5e',
};

// Shared styles
export const styles = {
    main: {
        backgroundColor: colors.background,
        fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
    },
    container: {
        margin: '0 auto',
        padding: '40px 20px',
        maxWidth: '560px',
    },
    logo: {
        margin: '0 auto 32px',
        display: 'block' as const,
    },
    card: {
        backgroundColor: colors.cardBackground,
        borderRadius: '24px',
        border: `1px solid ${colors.cardBorder}`,
        padding: '40px 32px',
        boxShadow: `0 32px 85px -40px ${colors.primaryGlow}`,
    },
    heading: {
        color: colors.text,
        fontSize: '28px',
        fontWeight: '700',
        textAlign: 'center' as const,
        margin: '0 0 8px',
        letterSpacing: '-0.02em',
    },
    subheading: {
        color: colors.textMuted,
        fontSize: '16px',
        textAlign: 'center' as const,
        margin: '0 0 32px',
        lineHeight: '24px',
    },
    paragraph: {
        color: colors.textMuted,
        fontSize: '15px',
        lineHeight: '26px',
        margin: '0 0 24px',
    },
    button: {
        backgroundColor: colors.primary,
        borderRadius: '12px',
        color: '#ffffff',
        display: 'block',
        fontSize: '16px',
        fontWeight: '600',
        textAlign: 'center' as const,
        textDecoration: 'none',
        padding: '14px 32px',
        margin: '32px auto',
        boxShadow: `0 8px 24px -8px ${colors.primaryGlow}`,
    },
    buttonSecondary: {
        backgroundColor: 'transparent',
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: '12px',
        color: colors.text,
        display: 'inline-block',
        fontSize: '14px',
        fontWeight: '500',
        textAlign: 'center' as const,
        textDecoration: 'none',
        padding: '12px 24px',
    },
    hr: {
        borderColor: colors.cardBorder,
        margin: '32px 0',
    },
    link: {
        color: colors.primary,
        textDecoration: 'none',
    },
    code: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        color: colors.text,
        display: 'inline-block',
        fontSize: '32px',
        fontWeight: '700',
        letterSpacing: '8px',
        padding: '16px 32px',
        fontFamily: 'monospace',
        margin: '24px auto',
        textAlign: 'center' as const,
    },
    footer: {
        color: colors.textSubtle,
        fontSize: '12px',
        textAlign: 'center' as const,
        marginTop: '40px',
        lineHeight: '20px',
    },
    footerLink: {
        color: colors.textSubtle,
        textDecoration: 'underline',
    },
    badge: {
        backgroundColor: colors.primaryGlow,
        borderRadius: '6px',
        color: colors.primaryLight,
        display: 'inline-block',
        fontSize: '11px',
        fontWeight: '600',
        letterSpacing: '0.5px',
        padding: '4px 10px',
        textTransform: 'uppercase' as const,
    },
    highlight: {
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        borderLeft: `3px solid ${colors.accent}`,
        borderRadius: '0 8px 8px 0',
        color: colors.text,
        fontSize: '14px',
        lineHeight: '22px',
        padding: '16px 20px',
        margin: '24px 0',
    },
    avatar: {
        borderRadius: '50%',
        border: `3px solid ${colors.cardBorder}`,
        display: 'block',
        margin: '0 auto 16px',
    },
    userCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        padding: '20px',
        textAlign: 'center' as const,
        margin: '24px 0',
    },
};

// Logo component
export const Logo = ({ size = 48 }: { size?: number }) => (
    <Img
        src="https://beta-cdn.realkink.men/emails/logo.png"
        width={size}
        height={size}
        alt="Real Kink Men"
        style={styles.logo}
    />
);

// Email wrapper component
export const EmailWrapper = ({
    preview,
    children,
}: {
    preview: string;
    children: React.ReactNode;
}) => (
    <Html>
        <Head />
        <Preview>{preview}</Preview>
        <Body style={styles.main}>
            <Container style={styles.container}>
                <Logo />
                <Section style={styles.card}>{children}</Section>
                <Text style={styles.footer}>
                    © {new Date().getFullYear()} Real Kink Men. All rights
                    reserved.
                    <br />
                    <Link
                        href="https://realkink.men/settings/notifications"
                        style={styles.footerLink}
                    >
                        Manage notification preferences
                    </Link>
                    {' • '}
                    <Link
                        href="https://realkink.men/privacy"
                        style={styles.footerLink}
                    >
                        Privacy Policy
                    </Link>
                    {' • '}
                    <Link
                        href="https://realkink.men/terms"
                        style={styles.footerLink}
                    >
                        Terms of Service
                    </Link>
                </Text>
            </Container>
        </Body>
    </Html>
);

// Primary button component
export const PrimaryButton = ({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) => (
    <Link href={href} style={styles.button}>
        {children}
    </Link>
);

// Secondary button component
export const SecondaryButton = ({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) => (
    <Link href={href} style={styles.buttonSecondary}>
        {children}
    </Link>
);

// Divider component
export const Divider = () => <Hr style={styles.hr} />;

// Code/OTP display component
export const CodeDisplay = ({ code }: { code: string }) => (
    <Text style={styles.code}>{code}</Text>
);

// User avatar card
export const UserCard = ({
    avatarUrl,
    name,
    username,
}: {
    avatarUrl?: string;
    name: string;
    username: string;
}) => (
    <Section style={styles.userCard}>
        {avatarUrl && (
            <Img
                src={avatarUrl}
                width={64}
                height={64}
                alt={name}
                style={styles.avatar}
            />
        )}
        <Text
            style={{
                color: colors.text,
                fontSize: '18px',
                fontWeight: '600',
                margin: '0 0 4px',
            }}
        >
            {name}
        </Text>
        <Text
            style={{
                color: colors.textMuted,
                fontSize: '14px',
                margin: 0,
            }}
        >
            @{username}
        </Text>
    </Section>
);

// Highlight box component
export const HighlightBox = ({ children }: { children: React.ReactNode }) => (
    <Section style={styles.highlight}>{children}</Section>
);

// Badge component
export const Badge = ({ children }: { children: React.ReactNode }) => (
    <span style={styles.badge}>{children}</span>
);


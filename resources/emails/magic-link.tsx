import { Heading, Link, Text } from '@react-email/components';
import * as React from 'react';

import {
    CodeDisplay,
    colors,
    Divider,
    EmailWrapper,
    PrimaryButton,
    styles,
} from './components/shared';

interface MagicLinkEmailProps {
    username: string;
    loginUrl: string;
    otp?: string;
    expiresIn: string;
    ipAddress?: string;
    location?: string;
}

export default function MagicLinkEmail({
    username = 'kinkster',
    loginUrl = 'https://realkink.men/login/magic/token123',
    otp = '847291',
    expiresIn = '10 minutes',
    ipAddress = '192.168.1.1',
    location = 'Toronto, Canada',
}: MagicLinkEmailProps) {
    return (
        <EmailWrapper preview="Your login link for Real Kink Men">
            <Heading style={styles.heading}>Sign In to Real Kink Men</Heading>
            <Text style={styles.subheading}>
                Click the button below or use the code
            </Text>

            <Text style={styles.paragraph}>
                Hey {username}, we received a request to sign in to your
                account. Click the button below to log in instantly:
            </Text>

            <PrimaryButton href={loginUrl}>Sign In Now</PrimaryButton>

            {otp && (
                <>
                    <Text
                        style={{
                            ...styles.paragraph,
                            textAlign: 'center',
                            margin: '32px 0 16px',
                        }}
                    >
                        Or enter this code manually:
                    </Text>
                    <CodeDisplay code={otp} />
                </>
            )}

            <Text
                style={{
                    ...styles.paragraph,
                    fontSize: '13px',
                    textAlign: 'center',
                    color: colors.textSubtle,
                }}
            >
                ⏰ This link expires in <strong>{expiresIn}</strong>
            </Text>

            {(ipAddress || location) && (
                <Text
                    style={{
                        ...styles.paragraph,
                        fontSize: '12px',
                        textAlign: 'center',
                        color: colors.textSubtle,
                    }}
                >
                    Request from: {location && `${location}`}
                    {ipAddress && location && ' • '}
                    {ipAddress && `IP: ${ipAddress}`}
                </Text>
            )}

            <Divider />

            <Text
                style={{
                    ...styles.paragraph,
                    fontSize: '12px',
                    color: colors.textSubtle,
                    marginBottom: 0,
                }}
            >
                If you didn't request this login, you can safely ignore this
                email. Someone may have typed your email by mistake.
                <br />
                <br />
                Button not working? Copy and paste this link:
                <br />
                <Link href={loginUrl} style={styles.link}>
                    {loginUrl}
                </Link>
            </Text>
        </EmailWrapper>
    );
}


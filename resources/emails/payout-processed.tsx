import { Heading, Section, Text } from '@react-email/components';
import * as React from 'react';

import {
    colors,
    Divider,
    EmailWrapper,
    PrimaryButton,
    styles,
} from './components/shared';

interface PayoutProcessedEmailProps {
    creatorName: string;
    amount: string;
    payoutMethod: string;
    estimatedArrival: string;
    periodStart: string;
    periodEnd: string;
    subscriptionEarnings: string;
    tipEarnings: string;
    platformFee: string;
    netAmount: string;
}

export default function PayoutProcessedEmail({
    creatorName = 'Creator',
    amount = '$1,234.56',
    payoutMethod = 'Bank Account (•••• 4567)',
    estimatedArrival = 'December 5-7, 2025',
    periodStart = 'November 1, 2025',
    periodEnd = 'November 30, 2025',
    subscriptionEarnings = '$1,150.00',
    tipEarnings = '$234.56',
    platformFee = '-$150.00',
    netAmount = '$1,234.56',
}: PayoutProcessedEmailProps) {
    return (
        <EmailWrapper preview={`Your ${amount} payout is on its way! 💰`}>
            <Heading style={styles.heading}>Payout Processed! 💸</Heading>
            <Text style={styles.subheading}>
                Your earnings are on their way
            </Text>

            <Section
                style={{
                    background: `linear-gradient(135deg, rgba(16, 185, 129, 0.2), ${colors.primaryGlow})`,
                    borderRadius: '20px',
                    padding: '32px',
                    margin: '24px 0',
                    textAlign: 'center',
                }}
            >
                <Text
                    style={{
                        color: colors.textMuted,
                        fontSize: '14px',
                        margin: '0 0 8px',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                    }}
                >
                    Amount
                </Text>
                <Text
                    style={{
                        color: colors.success,
                        fontSize: '48px',
                        fontWeight: '800',
                        margin: '0',
                        letterSpacing: '-2px',
                        textShadow: '0 4px 24px rgba(16, 185, 129, 0.4)',
                    }}
                >
                    {amount}
                </Text>
                <Text
                    style={{
                        color: colors.textMuted,
                        fontSize: '13px',
                        margin: '12px 0 0',
                    }}
                >
                    Arriving {estimatedArrival}
                </Text>
            </Section>

            <Section
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    padding: '24px',
                    margin: '24px 0',
                }}
            >
                <Text
                    style={{
                        color: colors.textMuted,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        margin: '0 0 16px',
                    }}
                >
                    Earnings Breakdown ({periodStart} - {periodEnd})
                </Text>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tr>
                        <td
                            style={{
                                color: colors.textMuted,
                                fontSize: '14px',
                                padding: '10px 0',
                            }}
                        >
                            Subscription earnings
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '14px',
                                padding: '10px 0',
                                textAlign: 'right',
                            }}
                        >
                            {subscriptionEarnings}
                        </td>
                    </tr>
                    <tr>
                        <td
                            style={{
                                color: colors.textMuted,
                                fontSize: '14px',
                                padding: '10px 0',
                            }}
                        >
                            Tips
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '14px',
                                padding: '10px 0',
                                textAlign: 'right',
                            }}
                        >
                            {tipEarnings}
                        </td>
                    </tr>
                    <tr>
                        <td
                            style={{
                                color: colors.textMuted,
                                fontSize: '14px',
                                padding: '10px 0',
                                borderBottom: `1px solid ${colors.cardBorder}`,
                            }}
                        >
                            Platform fee (10%)
                        </td>
                        <td
                            style={{
                                color: colors.primary,
                                fontSize: '14px',
                                padding: '10px 0',
                                textAlign: 'right',
                                borderBottom: `1px solid ${colors.cardBorder}`,
                            }}
                        >
                            {platformFee}
                        </td>
                    </tr>
                    <tr>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '16px',
                                fontWeight: '700',
                                padding: '14px 0 0',
                            }}
                        >
                            Net payout
                        </td>
                        <td
                            style={{
                                color: colors.success,
                                fontSize: '18px',
                                fontWeight: '700',
                                padding: '14px 0 0',
                                textAlign: 'right',
                            }}
                        >
                            {netAmount}
                        </td>
                    </tr>
                </table>
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
                            }}
                        >
                            Payout method:
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '13px',
                                textAlign: 'right',
                            }}
                        >
                            {payoutMethod}
                        </td>
                    </tr>
                </table>
            </Section>

            <PrimaryButton href="https://realkink.men/creator/earnings">
                View Full Report
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
                Keep up the amazing content, {creatorName}! 🔥
            </Text>
        </EmailWrapper>
    );
}


import { Heading, Section, Text } from '@react-email/components';
import * as React from 'react';

import {
    colors,
    Divider,
    EmailWrapper,
    PrimaryButton,
    styles,
} from './components/shared';

interface RefundProcessedEmailProps {
    customerName: string;
    transactionId: string;
    originalTransactionId: string;
    amount: string;
    reason: string;
    refundDate: string;
    estimatedArrival: string;
    paymentMethod: string;
    last4: string;
}

export default function RefundProcessedEmail({
    customerName = 'Kinkster',
    transactionId = 'REF-XYZ789',
    originalTransactionId = 'TXN-ABC123',
    amount = '$9.99',
    reason = 'Subscription cancellation - prorated refund',
    refundDate = 'December 3, 2025',
    estimatedArrival = '5-10 business days',
    paymentMethod = 'Visa',
    last4 = '4242',
}: RefundProcessedEmailProps) {
    return (
        <EmailWrapper preview={`Your ${amount} refund has been processed`}>
            <Heading style={styles.heading}>Refund Processed ✅</Heading>
            <Text style={styles.subheading}>
                Your refund is on its way, {customerName}
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
                    Refund Amount
                </Text>
                <Text
                    style={{
                        color: colors.success,
                        fontSize: '48px',
                        fontWeight: '800',
                        margin: '0',
                        letterSpacing: '-2px',
                    }}
                >
                    {amount}
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
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tr>
                        <td
                            style={{
                                color: colors.textMuted,
                                fontSize: '13px',
                                padding: '10px 0',
                            }}
                        >
                            Refund ID
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '13px',
                                padding: '10px 0',
                                textAlign: 'right',
                                fontFamily: 'monospace',
                            }}
                        >
                            {transactionId}
                        </td>
                    </tr>
                    <tr>
                        <td
                            style={{
                                color: colors.textMuted,
                                fontSize: '13px',
                                padding: '10px 0',
                            }}
                        >
                            Original Transaction
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '13px',
                                padding: '10px 0',
                                textAlign: 'right',
                                fontFamily: 'monospace',
                            }}
                        >
                            {originalTransactionId}
                        </td>
                    </tr>
                    <tr>
                        <td
                            style={{
                                color: colors.textMuted,
                                fontSize: '13px',
                                padding: '10px 0',
                            }}
                        >
                            Refund Date
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '13px',
                                padding: '10px 0',
                                textAlign: 'right',
                            }}
                        >
                            {refundDate}
                        </td>
                    </tr>
                    <tr>
                        <td
                            style={{
                                color: colors.textMuted,
                                fontSize: '13px',
                                padding: '10px 0',
                            }}
                        >
                            Refund To
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '13px',
                                padding: '10px 0',
                                textAlign: 'right',
                            }}
                        >
                            {paymentMethod} •••• {last4}
                        </td>
                    </tr>
                    <tr>
                        <td
                            style={{
                                color: colors.textMuted,
                                fontSize: '13px',
                                padding: '10px 0',
                            }}
                        >
                            Estimated Arrival
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '13px',
                                padding: '10px 0',
                                textAlign: 'right',
                            }}
                        >
                            {estimatedArrival}
                        </td>
                    </tr>
                    <tr>
                        <td
                            style={{
                                color: colors.textMuted,
                                fontSize: '13px',
                                padding: '10px 0',
                                borderTop: `1px solid ${colors.cardBorder}`,
                            }}
                        >
                            Reason
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '13px',
                                padding: '10px 0',
                                textAlign: 'right',
                                borderTop: `1px solid ${colors.cardBorder}`,
                            }}
                        >
                            {reason}
                        </td>
                    </tr>
                </table>
            </Section>

            <Text style={styles.paragraph}>
                The refund has been submitted to your payment provider. Please
                allow {estimatedArrival} for the funds to appear in your
                account.
            </Text>

            <PrimaryButton href="https://realkink.men/settings/billing">
                View Billing History
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
                Questions about this refund?{' '}
                <a href="mailto:billing@realkink.men" style={styles.link}>
                    Contact Billing Support
                </a>
            </Text>
        </EmailWrapper>
    );
}


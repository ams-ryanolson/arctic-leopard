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

interface PaymentFailedEmailProps {
    customerName: string;
    itemDescription: string;
    amount: string;
    failureReason: string;
    retryDate?: string;
    paymentMethod: string;
    last4: string;
}

export default function PaymentFailedEmail({
    customerName = 'Kinkster',
    itemDescription = 'Gold Member Subscription - MasterJohn',
    amount = '$9.99',
    failureReason = 'Your card was declined. Please check your card details or contact your bank.',
    retryDate = 'December 6, 2025',
    paymentMethod = 'Visa',
    last4 = '4242',
}: PaymentFailedEmailProps) {
    return (
        <EmailWrapper preview="Action required: Your payment failed">
            <Heading style={styles.heading}>Payment Failed ⚠️</Heading>
            <Text style={styles.subheading}>
                We couldn't process your payment
            </Text>

            <Text style={styles.paragraph}>
                Hey {customerName}, we tried to charge your payment method for
                your subscription but it didn't go through. Don't worry—we'll
                try again, but you may need to update your payment info.
            </Text>

            <Section
                style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
                            Item:
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '13px',
                                padding: '8px 0',
                                textAlign: 'right',
                            }}
                        >
                            {itemDescription}
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
                            Amount:
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '13px',
                                padding: '8px 0',
                                textAlign: 'right',
                                fontWeight: '600',
                            }}
                        >
                            {amount}
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
                            Payment Method:
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '13px',
                                padding: '8px 0',
                                textAlign: 'right',
                            }}
                        >
                            {paymentMethod} •••• {last4}
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
                    <strong>Why it failed:</strong>
                    <br />
                    {failureReason}
                </Text>
            </HighlightBox>

            {retryDate && (
                <Text style={styles.paragraph}>
                    We'll automatically retry this payment on{' '}
                    <strong>{retryDate}</strong>. To avoid any interruption to
                    your subscription, please update your payment method before
                    then.
                </Text>
            )}

            <PrimaryButton href="https://realkink.men/settings/billing">
                Update Payment Method
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
                Need help?{' '}
                <a href="mailto:billing@realkink.men" style={styles.link}>
                    Contact Billing Support
                </a>
            </Text>
        </EmailWrapper>
    );
}


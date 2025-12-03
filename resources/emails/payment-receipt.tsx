import { Heading, Section, Text } from '@react-email/components';
import * as React from 'react';

import {
    colors,
    Divider,
    EmailWrapper,
    PrimaryButton,
    styles,
} from './components/shared';

interface PaymentReceiptEmailProps {
    customerName: string;
    transactionId: string;
    date: string;
    items: Array<{
        description: string;
        amount: string;
    }>;
    subtotal: string;
    tax?: string;
    total: string;
    paymentMethod: string;
    last4: string;
}

export default function PaymentReceiptEmail({
    customerName = 'Kinkster',
    transactionId = 'TXN-ABC123XYZ',
    date = 'December 3, 2025',
    items = [
        { description: 'Gold Member Subscription - MasterJohn', amount: '$9.99' },
    ],
    subtotal = '$9.99',
    tax = '$0.00',
    total = '$9.99',
    paymentMethod = 'Visa',
    last4 = '4242',
}: PaymentReceiptEmailProps) {
    return (
        <EmailWrapper preview={`Receipt for your ${total} purchase`}>
            <Heading style={styles.heading}>Payment Receipt 🧾</Heading>
            <Text style={styles.subheading}>
                Thanks for your purchase, {customerName}!
            </Text>

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
                                fontSize: '12px',
                                padding: '8px 0',
                            }}
                        >
                            Transaction ID
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '12px',
                                padding: '8px 0',
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
                                fontSize: '12px',
                                padding: '8px 0',
                            }}
                        >
                            Date
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '12px',
                                padding: '8px 0',
                                textAlign: 'right',
                            }}
                        >
                            {date}
                        </td>
                    </tr>
                    <tr>
                        <td
                            style={{
                                color: colors.textMuted,
                                fontSize: '12px',
                                padding: '8px 0',
                            }}
                        >
                            Payment Method
                        </td>
                        <td
                            style={{
                                color: colors.text,
                                fontSize: '12px',
                                padding: '8px 0',
                                textAlign: 'right',
                            }}
                        >
                            {paymentMethod} •••• {last4}
                        </td>
                    </tr>
                </table>
            </Section>

            <Section
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    margin: '24px 0',
                }}
            >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th
                                style={{
                                    color: colors.textMuted,
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    padding: '16px 20px',
                                    textAlign: 'left',
                                    borderBottom: `1px solid ${colors.cardBorder}`,
                                }}
                            >
                                Description
                            </th>
                            <th
                                style={{
                                    color: colors.textMuted,
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    padding: '16px 20px',
                                    textAlign: 'right',
                                    borderBottom: `1px solid ${colors.cardBorder}`,
                                }}
                            >
                                Amount
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td
                                    style={{
                                        color: colors.text,
                                        fontSize: '14px',
                                        padding: '16px 20px',
                                        borderBottom: `1px solid ${colors.cardBorder}`,
                                    }}
                                >
                                    {item.description}
                                </td>
                                <td
                                    style={{
                                        color: colors.text,
                                        fontSize: '14px',
                                        padding: '16px 20px',
                                        textAlign: 'right',
                                        borderBottom: `1px solid ${colors.cardBorder}`,
                                    }}
                                >
                                    {item.amount}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td
                                style={{
                                    color: colors.textMuted,
                                    fontSize: '13px',
                                    padding: '12px 20px',
                                }}
                            >
                                Subtotal
                            </td>
                            <td
                                style={{
                                    color: colors.text,
                                    fontSize: '13px',
                                    padding: '12px 20px',
                                    textAlign: 'right',
                                }}
                            >
                                {subtotal}
                            </td>
                        </tr>
                        {tax && (
                            <tr>
                                <td
                                    style={{
                                        color: colors.textMuted,
                                        fontSize: '13px',
                                        padding: '12px 20px',
                                    }}
                                >
                                    Tax
                                </td>
                                <td
                                    style={{
                                        color: colors.text,
                                        fontSize: '13px',
                                        padding: '12px 20px',
                                        textAlign: 'right',
                                    }}
                                >
                                    {tax}
                                </td>
                            </tr>
                        )}
                        <tr>
                            <td
                                style={{
                                    color: colors.text,
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    padding: '16px 20px',
                                    borderTop: `1px solid ${colors.cardBorder}`,
                                }}
                            >
                                Total
                            </td>
                            <td
                                style={{
                                    color: colors.success,
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    padding: '16px 20px',
                                    textAlign: 'right',
                                    borderTop: `1px solid ${colors.cardBorder}`,
                                }}
                            >
                                {total}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </Section>

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
                Questions about this charge?{' '}
                <a href="mailto:billing@realkink.men" style={styles.link}>
                    Contact Billing Support
                </a>
            </Text>
        </EmailWrapper>
    );
}


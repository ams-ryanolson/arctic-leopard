import {
    CCBillCardForm,
    type CardDetails,
} from '@/components/payments/CCBillCardForm';
import { CheckoutSummary } from '@/components/payments/CheckoutSummary';
import { PaymentMethodSelector } from '@/components/payments/PaymentMethodSelector';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { useVaultPaymentMethod } from '@/hooks/use-vault-payment-method';
import { useState } from 'react';

type CheckoutSummaryItem = {
    label: string;
    amount: number;
    currency: string;
};

type CheckoutFormProps = {
    clientAccnum: number;
    clientSubacc: number;
    items: CheckoutSummaryItem[];
    subtotal?: number;
    fees?: CheckoutSummaryItem[];
    discount?: {
        label: string;
        amount: number;
    };
    total: number;
    currency: string;
    onPaymentMethodSelected: (paymentMethodId: number | null) => void;
    onNewCardVaulted?: (paymentMethodId: number) => void;
    gateway?: string;
    allowNewCards?: boolean;
    className?: string;
};

export function CheckoutForm({
    clientAccnum,
    clientSubacc,
    items,
    subtotal,
    fees,
    discount,
    total,
    currency,
    onPaymentMethodSelected,
    onNewCardVaulted,
    gateway = 'ccbill',
    allowNewCards = true,
    className,
}: CheckoutFormProps) {
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
        number | null
    >(null);
    const [showNewCardForm, setShowNewCardForm] = useState(false);
    const { paymentMethods } = usePaymentMethods();
    const { vault } = useVaultPaymentMethod();

    const handlePaymentMethodSelect = (id: number | null) => {
        setSelectedPaymentMethodId(id);
        setShowNewCardForm(false);
        onPaymentMethodSelected(id);
    };

    const handleAddNewCard = () => {
        setShowNewCardForm(true);
        setSelectedPaymentMethodId(null);
        onPaymentMethodSelected(null);
    };

    const handleTokenCreated = async (
        tokenId: string,
        is3DS: boolean,
        cardDetails: CardDetails,
    ) => {
        try {
            const paymentMethod = await vault({
                provider_token_id: tokenId,
                gateway,
                is_default: paymentMethods.length === 0,
                card_last_four: cardDetails.lastFour,
                card_brand: cardDetails.brand,
                card_exp_month: cardDetails.expMonth,
                card_exp_year: cardDetails.expYear,
            });

            setShowNewCardForm(false);
            setSelectedPaymentMethodId(paymentMethod.id);
            onPaymentMethodSelected(paymentMethod.id);
            onNewCardVaulted?.(paymentMethod.id);
        } catch (error) {
            // Error handling is done in the CCBillCardForm component
            console.error('Failed to vault payment method:', error);
        }
    };

    return (
        <div className={className}>
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Method</CardTitle>
                            <CardDescription>
                                Select a saved card or add a new one
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!showNewCardForm ? (
                                <PaymentMethodSelector
                                    selectedId={selectedPaymentMethodId}
                                    onSelect={handlePaymentMethodSelect}
                                    onAddNew={handleAddNewCard}
                                    showAddButton={allowNewCards}
                                />
                            ) : (
                                <div className="space-y-4">
                                    <CCBillCardForm
                                        clientAccnum={clientAccnum}
                                        clientSubacc={clientSubacc}
                                        onTokenCreated={handleTokenCreated}
                                        gateway={gateway}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowNewCardForm(false);
                                        }}
                                        className="text-sm text-white/60 hover:text-white/80"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CheckoutSummary
                                items={items}
                                subtotal={subtotal}
                                fees={fees}
                                discount={discount}
                                total={total}
                                currency={currency}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

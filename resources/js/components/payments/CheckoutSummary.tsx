import { Separator } from '@/components/ui/separator';

type CheckoutSummaryItem = {
    label: string;
    amount: number;
    currency: string;
};

type CheckoutSummaryProps = {
    items: CheckoutSummaryItem[];
    subtotal?: number;
    fees?: CheckoutSummaryItem[];
    discount?: {
        label: string;
        amount: number;
    };
    total: number;
    currency: string;
    className?: string;
};

function formatCurrency(cents: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(cents / 100);
}

export function CheckoutSummary({
    items,
    subtotal,
    fees = [],
    discount,
    total,
    currency,
    className,
}: CheckoutSummaryProps) {
    const displaySubtotal =
        subtotal ?? items.reduce((sum, item) => sum + item.amount, 0);
    const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const discountAmount = discount?.amount ?? 0;
    const _calculatedTotal = displaySubtotal + totalFees - discountAmount;

    return (
        <div className={className}>
            <div className="space-y-4">
                {items.length > 0 && (
                    <div className="space-y-2">
                        {items.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between text-sm"
                            >
                                <span className="text-white/80">
                                    {item.label}
                                </span>
                                <span className="font-medium">
                                    {formatCurrency(item.amount, item.currency)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {subtotal !== undefined && (
                    <>
                        <Separator />
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-white/80">Subtotal</span>
                            <span className="font-medium">
                                {formatCurrency(displaySubtotal, currency)}
                            </span>
                        </div>
                    </>
                )}

                {fees.length > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            {fees.map((fee, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <span className="text-white/80">
                                        {fee.label}
                                    </span>
                                    <span className="font-medium">
                                        {formatCurrency(
                                            fee.amount,
                                            fee.currency,
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {discount && discountAmount > 0 && (
                    <>
                        <Separator />
                        <div className="flex items-center justify-between text-sm text-green-400">
                            <span>{discount.label}</span>
                            <span className="font-medium">
                                -{formatCurrency(discountAmount, currency)}
                            </span>
                        </div>
                    </>
                )}

                <Separator />
                <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(total, currency)}</span>
                </div>
            </div>
        </div>
    );
}

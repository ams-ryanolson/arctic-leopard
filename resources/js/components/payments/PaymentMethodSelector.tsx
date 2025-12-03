import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    usePaymentMethods,
    type PaymentMethod,
} from '@/hooks/use-payment-methods';
import { CreditCard, Plus } from 'lucide-react';

type PaymentMethodSelectorProps = {
    selectedId: number | null;
    onSelect: (id: number | null) => void;
    onAddNew: () => void;
    showAddButton?: boolean;
};

function formatCardBrand(brand: string): string {
    return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
}

function formatExpiry(expMonth: string, expYear: string): string {
    const month = expMonth.padStart(2, '0');
    const year = expYear.slice(-2);
    return `${month}/${year}`;
}

export function PaymentMethodSelector({
    selectedId,
    onSelect,
    onAddNew,
    showAddButton = true,
}: PaymentMethodSelectorProps) {
    const { paymentMethods, loading } = usePaymentMethods();

    if (loading) {
        return (
            <div className="space-y-3">
                <div className="h-20 animate-pulse rounded-lg bg-white/5" />
                <div className="h-20 animate-pulse rounded-lg bg-white/5" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <RadioGroup
                value={selectedId?.toString() ?? ''}
                onValueChange={(value) =>
                    onSelect(value ? parseInt(value, 10) : null)
                }
            >
                {paymentMethods.map((method: PaymentMethod) => (
                    <label
                        key={method.id}
                        htmlFor={`payment-method-${method.id}`}
                        className="flex cursor-pointer items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
                    >
                        <RadioGroupItem
                            id={`payment-method-${method.id}`}
                            value={method.id.toString()}
                        />
                        <div className="flex flex-1 items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CreditCard className="size-5 text-white/60" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                            {formatCardBrand(method.brand)} ••••{' '}
                                            {method.last_four}
                                        </span>
                                        {method.is_default && (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                Default
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-white/60">
                                        Expires{' '}
                                        {formatExpiry(
                                            method.exp_month,
                                            method.exp_year,
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </label>
                ))}
            </RadioGroup>

            {showAddButton && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={onAddNew}
                    className="w-full"
                >
                    <Plus className="size-4" />
                    Add New Card
                </Button>
            )}
        </div>
    );
}

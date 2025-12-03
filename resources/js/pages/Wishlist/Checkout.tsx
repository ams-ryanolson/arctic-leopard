import InputError from '@/components/input-error';
import { CheckoutSummary } from '@/components/payments/CheckoutSummary';
import { PaymentMethodSelector } from '@/components/payments/PaymentMethodSelector';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import wishlistRoutes from '@/routes/wishlist';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Gift, Loader2 } from 'lucide-react';
import { FormEvent, useState } from 'react';

type WishlistItem = {
    id: number;
    uuid: string;
    title: string;
    description: string | null;
    amount: number | null;
    currency: string | null;
    url: string | null;
    image_url: string | null;
    quantity: number | null;
    is_crowdfunded: boolean;
    goal_amount: number | null;
    current_funding: number;
    status: string;
    progress_percentage: number;
    remaining_quantity: number | null;
    expires_at: string | null;
    is_active: boolean;
    can_be_purchased: boolean;
    purchase_count: number;
    creator: {
        id: number;
        username: string;
        display_name: string;
        avatar_url: string | null;
    };
};

type CheckoutPageProps = {
    item: WishlistItem;
    fee_percent: number;
    minimum_contribution: number;
    ccbill_client_accnum?: number;
    ccbill_client_subacc?: number;
};

function formatCurrency(
    cents: number | null,
    currency: string | null = 'USD',
): string {
    if (cents === null) {
        return 'N/A';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency ?? 'USD',
        maximumFractionDigits: 2,
    }).format(cents / 100);
}

export default function WishlistCheckout({
    item,
    fee_percent,
    minimum_contribution,
    ccbill_client_accnum,
    ccbill_client_subacc,
}: CheckoutPageProps) {
    const [coversFee, setCoversFee] = useState(false);
    const [contributionAmount, setContributionAmount] = useState<string>(
        item.is_crowdfunded ? '' : item.amount ? String(item.amount / 100) : '',
    );
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
        number | null
    >(null);

    const { data, setData, post, processing, errors } = useForm({
        amount: item.is_crowdfunded
            ? minimum_contribution
            : (item.amount ?? minimum_contribution),
        currency: item.currency ?? 'USD',
        covers_fee: false,
        message: '',
        gateway:
            ccbill_client_accnum && ccbill_client_subacc ? 'ccbill' : 'fake',
        method: 'card',
        payment_method_id: null as number | null,
    });

    const baseAmount = item.is_crowdfunded
        ? contributionAmount
            ? Math.max(minimum_contribution, parseInt(contributionAmount) * 100)
            : minimum_contribution
        : (item.amount ?? minimum_contribution);

    const feeAmount = coversFee
        ? Math.round(baseAmount * (fee_percent / 100))
        : 0;
    const totalAmount = baseAmount + feeAmount;

    const handleAmountChange = (value: string) => {
        setContributionAmount(value);
        const amountInCents = value
            ? Math.max(minimum_contribution, parseInt(value) * 100)
            : minimum_contribution;
        setData('amount', amountInCents);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (
            item.is_crowdfunded &&
            (!contributionAmount ||
                parseInt(contributionAmount) * 100 < minimum_contribution)
        ) {
            return;
        }

        setData({
            ...data,
            covers_fee: coversFee,
            amount: baseAmount,
            payment_method_id: selectedPaymentMethodId,
        });

        post(wishlistRoutes.purchase.url(item.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                if (page.props.payment_intent) {
                    console.log(
                        'Payment intent created:',
                        page.props.payment_intent,
                    );
                }
            },
        });
    };

    const creatorUsername = item.creator?.username || 'unknown';

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Wishlist', href: `/w/${creatorUsername}` },
                { title: 'Checkout', href: '#' },
            ]}
        >
            <Head title={`Checkout - ${item.title}`} />

            <div className="mx-auto max-w-4xl space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <a href={`/w/${creatorUsername}`}>
                            <ArrowLeft className="mr-2 size-4" />
                            Back to Wishlist
                        </a>
                    </Button>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Card className="border-white/10 bg-white/5 text-white">
                            <CardHeader>
                                <CardTitle className="text-2xl font-semibold">
                                    Wishlist Item
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-4">
                                    {item.image_url && (
                                        <img
                                            src={item.image_url}
                                            alt={item.title}
                                            className="h-24 w-24 rounded-xl border border-white/10 object-cover"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold">
                                            {item.title}
                                        </h3>
                                        {item.description && (
                                            <p className="mt-1 text-sm text-white/70">
                                                {item.description}
                                            </p>
                                        )}
                                        {item.is_crowdfunded ? (
                                            <div className="mt-2 space-y-2">
                                                <div className="flex items-center justify-between text-xs text-white/70">
                                                    <span>Progress</span>
                                                    <span>
                                                        {Math.round(
                                                            item.progress_percentage,
                                                        )}
                                                        %
                                                    </span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500"
                                                        style={{
                                                            width: `${Math.min(item.progress_percentage, 100)}%`,
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-xs text-white/60">
                                                    {formatCurrency(
                                                        item.current_funding,
                                                        item.currency,
                                                    )}{' '}
                                                    of{' '}
                                                    {formatCurrency(
                                                        item.goal_amount,
                                                        item.currency,
                                                    )}{' '}
                                                    raised
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="mt-2 text-sm text-white/70">
                                                {item.remaining_quantity !==
                                                null
                                                    ? `${item.remaining_quantity} ${item.remaining_quantity === 1 ? 'item' : 'items'} remaining`
                                                    : formatCurrency(
                                                          item.amount,
                                                          item.currency,
                                                      )}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-white/10 bg-white/5 text-white">
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold">
                                    Contribution Details
                                </CardTitle>
                                <CardDescription className="text-white/60">
                                    {item.is_crowdfunded
                                        ? 'Enter your contribution amount (minimum $5.00)'
                                        : 'Review your purchase details'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <form
                                    onSubmit={handleSubmit}
                                    className="space-y-6"
                                >
                                    {item.is_crowdfunded ? (
                                        <div className="space-y-2">
                                            <Label htmlFor="amount">
                                                Contribution Amount (USD) *
                                            </Label>
                                            <Input
                                                id="amount"
                                                type="number"
                                                min={minimum_contribution / 100}
                                                step="0.01"
                                                value={contributionAmount}
                                                onChange={(e) =>
                                                    handleAmountChange(
                                                        e.target.value,
                                                    )
                                                }
                                                className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
                                                placeholder="5.00"
                                                required
                                            />
                                            <p className="text-xs text-white/60">
                                                Minimum contribution:{' '}
                                                {formatCurrency(
                                                    minimum_contribution,
                                                    'USD',
                                                )}
                                            </p>
                                            <InputError
                                                message={errors.amount}
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label>Purchase Amount</Label>
                                            <div className="rounded-xl border border-white/20 bg-black/40 p-4">
                                                <p className="text-2xl font-semibold text-white">
                                                    {formatCurrency(
                                                        item.amount,
                                                        item.currency,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="message">
                                            Message (Optional)
                                        </Label>
                                        <Textarea
                                            id="message"
                                            value={data.message}
                                            onChange={(e) =>
                                                setData(
                                                    'message',
                                                    e.target.value,
                                                )
                                            }
                                            className="border-white/20 bg-black/40 text-white placeholder:text-white/40"
                                            placeholder="Add a personal message..."
                                            rows={3}
                                        />
                                        <InputError message={errors.message} />
                                    </div>

                                    <div className="space-y-3 rounded-xl border border-white/20 bg-black/40 p-4">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="covers-fee"
                                                checked={coversFee}
                                                onCheckedChange={(checked) => {
                                                    setCoversFee(
                                                        checked === true,
                                                    );
                                                    setData(
                                                        'covers_fee',
                                                        checked === true,
                                                    );
                                                }}
                                            />
                                            <Label
                                                htmlFor="covers-fee"
                                                className="cursor-pointer text-sm"
                                            >
                                                I'll cover the platform fee (
                                                {fee_percent}%)
                                            </Label>
                                        </div>
                                        {coversFee && (
                                            <p className="ml-6 text-xs text-white/60">
                                                Platform fee:{' '}
                                                {formatCurrency(
                                                    feeAmount,
                                                    item.currency ?? 'USD',
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    <Separator className="border-white/10" />

                                    <div className="space-y-2">
                                        <Label>Payment Method</Label>
                                        {ccbill_client_accnum &&
                                        ccbill_client_subacc ? (
                                            <PaymentMethodSelector
                                                selectedId={
                                                    selectedPaymentMethodId
                                                }
                                                onSelect={
                                                    setSelectedPaymentMethodId
                                                }
                                                onAddNew={() => {
                                                    // Could open a modal or navigate to settings
                                                    window.location.href =
                                                        '/settings/payment-methods';
                                                }}
                                                showAddButton={true}
                                            />
                                        ) : (
                                            <p className="text-sm text-white/60">
                                                Payment method selection will be
                                                available after CCBill is
                                                configured.
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={
                                            processing ||
                                            (item.is_crowdfunded &&
                                                (!contributionAmount ||
                                                    parseInt(
                                                        contributionAmount,
                                                    ) *
                                                        100 <
                                                        minimum_contribution)) ||
                                            (!selectedPaymentMethodId &&
                                                ccbill_client_accnum &&
                                                ccbill_client_subacc)
                                        }
                                        className="w-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 text-white"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Gift className="mr-2 size-4" />
                                                {item.is_crowdfunded
                                                    ? 'Contribute'
                                                    : 'Complete Purchase'}
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="border-white/10 bg-white/5 text-white">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">
                                    Order Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CheckoutSummary
                                    items={[
                                        {
                                            label: item.is_crowdfunded
                                                ? 'Contribution'
                                                : 'Item Price',
                                            amount: baseAmount,
                                            currency: item.currency ?? 'USD',
                                        },
                                    ]}
                                    fees={
                                        coversFee
                                            ? [
                                                  {
                                                      label: `Platform Fee (${fee_percent}%)`,
                                                      amount: feeAmount,
                                                      currency:
                                                          item.currency ??
                                                          'USD',
                                                  },
                                              ]
                                            : []
                                    }
                                    total={totalAmount}
                                    currency={item.currency ?? 'USD'}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

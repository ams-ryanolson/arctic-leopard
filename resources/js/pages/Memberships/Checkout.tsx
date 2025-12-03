import { CheckoutSummary } from '@/components/payments/CheckoutSummary';
import { PaymentMethodSelector } from '@/components/payments/PaymentMethodSelector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import AppLayout from '@/layouts/app-layout';
import membershipsRoutes from '@/routes/memberships';
import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Crown,
    Gift,
    Loader2,
    Tag,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

type MembershipPlan = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    monthly_price: number;
    yearly_price: number;
    currency: string;
    features: Record<string, string>;
    allows_recurring: boolean;
    allows_one_time: boolean;
};

type GiftRecipient = {
    id: number;
    username: string;
    display_name: string;
};

type PaymentIntent = {
    id: number;
    uuid: string;
    amount: number;
    currency: string;
    status: string;
    provider_intent_id: string;
};

type PaymentIntentError = {
    message: string;
    expired?: boolean;
};

type CheckoutPageProps = {
    plan: MembershipPlan;
    payment_intent_id?: number;
    payment_intent?: PaymentIntent;
    payment_intent_error?: PaymentIntentError;
    is_gift?: boolean;
    gift_recipient?: GiftRecipient | null;
    ccbill_client_accnum?: number;
    ccbill_client_subacc?: number;
};

export default function MembershipCheckout({
    plan,
    payment_intent_id,
    payment_intent,
    payment_intent_error,
    is_gift = false,
    gift_recipient,
    ccbill_client_accnum,
    ccbill_client_subacc,
}: CheckoutPageProps) {
    // For gifts, lock billing type to one_time
    // For plans that don't allow recurring, default to one_time
    const getDefaultBillingType = (): 'recurring' | 'one_time' => {
        if (is_gift) return 'one_time';
        if (!plan.allows_recurring && plan.allows_one_time) return 'one_time';
        if (plan.allows_recurring) return 'recurring';
        return 'one_time';
    };
    const [billingType, setBillingType] = useState<'recurring' | 'one_time'>(
        getDefaultBillingType(),
    );
    const [billingInterval, setBillingInterval] = useState<
        'monthly' | 'yearly'
    >('monthly');
    const [discountCode, setDiscountCode] = useState('');
    const [discountApplied, setDiscountApplied] = useState<{
        code: string;
        amount: number;
        final_price: number;
    } | null>(null);
    const [applyingDiscount, setApplyingDiscount] = useState(false);
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
        number | null
    >(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: _data, setData, post: _post, processing: _processing, errors } = useForm({
        plan_id: plan.id,
        billing_type: getDefaultBillingType(),
        billing_interval: 'monthly',
        discount_code: undefined as string | undefined,
        gateway:
            ccbill_client_accnum && ccbill_client_subacc ? 'ccbill' : 'fake',
        method: 'card',
        payment_method_id: null as number | null,
    });

    // Sync billing type with form data when it changes
    useEffect(() => {
        setData('billing_type', billingType);
    }, [billingType]);

    // Sync billing interval with form data when it changes
    useEffect(() => {
        setData('billing_interval', billingInterval);
    }, [billingInterval]);

    const _formatPrice = (cents: number, currency: string = 'USD'): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(cents / 100);
    };

    // For gifts, use payment intent amount; otherwise calculate from plan
    const basePrice =
        is_gift && payment_intent
            ? payment_intent.amount
            : billingInterval === 'yearly'
              ? plan.yearly_price
              : plan.monthly_price;
    const finalPrice = is_gift
        ? basePrice // Gifts don't support discounts
        : discountApplied
          ? discountApplied.final_price
          : basePrice;
    const discountAmount = is_gift
        ? 0
        : discountApplied
          ? discountApplied.amount
          : 0;

    const applyDiscount = async () => {
        if (!discountCode.trim()) {
            return;
        }

        setApplyingDiscount(true);
        try {
            const response = await fetch(
                membershipsRoutes.applyDiscount().url,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({
                        code: discountCode,
                        plan_id: plan.id,
                        price: basePrice,
                    }),
                },
            );

            const result = await response.json();

            if (result.valid) {
                setDiscountApplied({
                    code: result.discount.code,
                    amount: result.discount_amount,
                    final_price: result.final_price,
                });
                setData('discount_code', discountCode);
            } else {
                alert(result.message || 'Invalid discount code');
            }
        } catch (error) {
            console.error('Error applying discount:', error);
            alert('Failed to apply discount code');
        } finally {
            setApplyingDiscount(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // For gifts, submit to gift completion endpoint
        if (is_gift && payment_intent_id) {
            setIsSubmitting(true);
            try {
                const response = await fetch(
                    membershipsRoutes.gift.complete().url,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-CSRF-TOKEN':
                                document
                                    .querySelector('meta[name="csrf-token"]')
                                    ?.getAttribute('content') || '',
                        },
                        body: JSON.stringify({
                            payment_intent_id: payment_intent_id,
                            payment_method_id: selectedPaymentMethodId,
                        }),
                    },
                );

                const result = await response.json();

                if (!response.ok) {
                    console.error('Error completing gift payment:', result);
                    alert(result.message || 'Failed to complete gift payment');
                    return;
                }

                // Redirect to success page
                router.visit('/upgrade', {
                    data: {
                        gift_success: true,
                        recipient_name:
                            gift_recipient?.display_name ||
                            gift_recipient?.username,
                        plan_name: plan.name,
                    },
                });
            } catch (error) {
                console.error('Error completing gift payment:', error);
                alert('An error occurred while processing the gift payment');
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        // Regular purchase flow
        if (!plan.allows_recurring && billingType === 'recurring') {
            alert('Recurring billing is not available for this plan');
            return;
        }

        if (!plan.allows_one_time && billingType === 'one_time') {
            alert('One-time purchase is not available for this plan');
            return;
        }

        // Use fetch since the endpoint returns JSON, not an Inertia response
        setIsSubmitting(true);
        try {
            const response = await fetch(membershipsRoutes.purchase().url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    plan_id: plan.id,
                    billing_type: billingType,
                    billing_interval: billingInterval,
                    discount_code: discountApplied?.code || undefined,
                    gateway:
                        ccbill_client_accnum && ccbill_client_subacc
                            ? 'ccbill'
                            : 'fake',
                    method: 'card',
                    payment_method_id: selectedPaymentMethodId,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                // Handle validation errors
                if (result.errors) {
                    const errorMessages = Object.values(result.errors)
                        .flat()
                        .join('\n');
                    alert(errorMessages);
                } else if (result.message) {
                    alert(result.message);
                } else {
                    alert('An error occurred while processing your purchase.');
                }
                return;
            }

            // Check if it was a free membership (100% discount)
            if (result.free_membership) {
                // Redirect to success/dashboard
                router.visit('/dashboard', {
                    data: { membership_success: true, plan_name: plan.name },
                });
                return;
            }

            // Payment intent created - now we need to capture it with the selected payment method
            if (result.payment_intent && selectedPaymentMethodId) {
                // Capture the payment
                const captureResponse = await fetch('/api/payments/capture', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({
                        payment_intent_id: result.payment_intent.id,
                        payment_method_id: selectedPaymentMethodId,
                    }),
                });

                const captureResult = await captureResponse.json();

                if (!captureResponse.ok) {
                    alert(
                        captureResult.message || 'Failed to process payment.',
                    );
                    return;
                }

                // Success - redirect to dashboard
                router.visit('/dashboard', {
                    data: { membership_success: true, plan_name: plan.name },
                });
            } else if (result.payment_intent) {
                // No payment method selected - this shouldn't happen with our UI
                alert(
                    'Please select a payment method to complete your purchase.',
                );
            }
        } catch (error) {
            console.error('Purchase error:', error);
            alert('An error occurred while processing your purchase.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Upgrade', href: '/upgrade' },
                { title: 'Checkout', href: '#' },
            ]}
        >
            <Head title={`Checkout - ${plan.name}`} />

            <div className="mx-auto max-w-4xl space-y-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <a href="/upgrade">
                            <ArrowLeft className="mr-2 size-4" />
                            Back to Plans
                        </a>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">
                            {is_gift
                                ? 'Gift Membership Checkout'
                                : 'Complete Your Purchase'}
                        </h1>
                        <p className="mt-2 text-sm text-white/70">
                            {is_gift && gift_recipient
                                ? `Gifting ${plan.name} to ${gift_recipient.display_name || gift_recipient.username}`
                                : 'Review your membership selection and complete payment'}
                        </p>
                    </div>
                </div>

                {is_gift && gift_recipient && (
                    <Card className="border-amber-400/30 bg-amber-400/10">
                        <CardContent className="flex items-center gap-4 pt-6">
                            <div className="flex size-12 items-center justify-center rounded-full bg-amber-400/20">
                                <Gift className="size-6 text-amber-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-amber-300">
                                    Gift Membership
                                </p>
                                <p className="text-xs text-white/70">
                                    This membership will be gifted to{' '}
                                    <span className="font-medium text-white">
                                        {gift_recipient.display_name ||
                                            gift_recipient.username}
                                    </span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Show error if payment intent is invalid/expired */}
                {payment_intent_error && (
                    <Card className="border-red-400/30 bg-red-400/10">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <div className="flex size-12 items-center justify-center rounded-full bg-red-400/20">
                                    <Loader2 className="size-6 text-red-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-red-300">
                                        Payment Session Error
                                    </p>
                                    <p className="mt-1 text-xs text-white/70">
                                        {payment_intent_error.message}
                                    </p>
                                    <div className="mt-4 flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                // Go back to profile or create new gift
                                                if (gift_recipient) {
                                                    router.visit(
                                                        `/p/${gift_recipient.username}`,
                                                    );
                                                } else {
                                                    router.visit('/upgrade');
                                                }
                                            }}
                                        >
                                            Go Back
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Don't show checkout form if payment intent is invalid */}
                {payment_intent_error ? null : (
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="space-y-6 lg:col-span-2">
                                <Card className="border-white/10 bg-white/5">
                                    <CardHeader>
                                        <CardTitle className="text-white">
                                            Membership Plan
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Crown className="size-5 text-amber-400" />
                                            <div>
                                                <p className="font-semibold text-white">
                                                    {plan.name}
                                                </p>
                                                {plan.description && (
                                                    <p className="text-sm text-white/60">
                                                        {plan.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {plan.features &&
                                            Object.keys(plan.features).length >
                                                0 && (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-white/70">
                                                        Features included:
                                                    </p>
                                                    <ul className="space-y-2">
                                                        {Object.entries(
                                                            plan.features,
                                                        ).map(
                                                            ([key, value]) => (
                                                                <li
                                                                    key={key}
                                                                    className="flex items-start gap-2 text-sm text-white/80"
                                                                >
                                                                    <CheckCircle2 className="mt-0.5 size-4 text-emerald-300" />
                                                                    <span>
                                                                        {value}
                                                                    </span>
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                    </CardContent>
                                </Card>

                                {/* Hide billing options for gifts */}
                                {!is_gift && (
                                    <Card className="border-white/10 bg-white/5">
                                        <CardHeader>
                                            <CardTitle className="text-white">
                                                Billing Options
                                            </CardTitle>
                                            <CardDescription className="text-white/60">
                                                Choose how you want to be billed
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <RadioGroup
                                                value={billingType}
                                                onValueChange={(value) => {
                                                    setBillingType(
                                                        value as
                                                            | 'recurring'
                                                            | 'one_time',
                                                    );
                                                }}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem
                                                        value="recurring"
                                                        id="recurring"
                                                        disabled={
                                                            !plan.allows_recurring
                                                        }
                                                    />
                                                    <Label
                                                        htmlFor="recurring"
                                                        className={`${!plan.allows_recurring ? 'text-white/40' : 'text-white'}`}
                                                    >
                                                        Recurring Subscription
                                                        {!plan.allows_recurring && (
                                                            <span className="ml-2 text-xs text-white/40">
                                                                (Not available
                                                                for this plan)
                                                            </span>
                                                        )}
                                                    </Label>
                                                </div>
                                                {billingType ===
                                                    'recurring' && (
                                                    <div className="ml-6 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                type="button"
                                                                variant={
                                                                    billingInterval ===
                                                                    'monthly'
                                                                        ? 'default'
                                                                        : 'outline'
                                                                }
                                                                size="sm"
                                                                onClick={() => {
                                                                    setBillingInterval(
                                                                        'monthly',
                                                                    );
                                                                }}
                                                            >
                                                                Monthly
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant={
                                                                    billingInterval ===
                                                                    'yearly'
                                                                        ? 'default'
                                                                        : 'outline'
                                                                }
                                                                size="sm"
                                                                onClick={() => {
                                                                    setBillingInterval(
                                                                        'yearly',
                                                                    );
                                                                }}
                                                            >
                                                                Yearly
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="ml-2 bg-emerald-500/20 text-emerald-400"
                                                                >
                                                                    Save 2
                                                                    months
                                                                </Badge>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem
                                                        value="one_time"
                                                        id="one_time"
                                                        disabled={
                                                            !plan.allows_one_time
                                                        }
                                                    />
                                                    <Label
                                                        htmlFor="one_time"
                                                        className={`${!plan.allows_one_time ? 'text-white/40' : 'text-white'}`}
                                                    >
                                                        One-Time Purchase
                                                        {!plan.allows_one_time && (
                                                            <span className="ml-2 text-xs text-white/40">
                                                                (Not available
                                                                for this plan)
                                                            </span>
                                                        )}
                                                    </Label>
                                                </div>
                                            </RadioGroup>

                                            {errors.billing_type && (
                                                <p className="text-sm text-red-400">
                                                    {errors.billing_type}
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Hide discount code for gifts */}
                                {!is_gift && (
                                    <Card className="border-white/10 bg-white/5">
                                        <CardHeader>
                                            <CardTitle className="text-white">
                                                Discount Code
                                            </CardTitle>
                                            <CardDescription className="text-white/60">
                                                Have a discount code? Enter it
                                                here
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex gap-2">
                                                <Input
                                                    value={discountCode}
                                                    onChange={(e) =>
                                                        setDiscountCode(
                                                            e.target.value.toUpperCase(),
                                                        )
                                                    }
                                                    placeholder="Enter code"
                                                    className="border-white/10 bg-white/5 text-white"
                                                    disabled={
                                                        applyingDiscount ||
                                                        !!discountApplied
                                                    }
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={applyDiscount}
                                                    disabled={
                                                        applyingDiscount ||
                                                        !discountCode.trim() ||
                                                        !!discountApplied
                                                    }
                                                >
                                                    {applyingDiscount ? (
                                                        <Loader2 className="size-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Tag className="mr-2 size-4" />
                                                            Apply
                                                        </>
                                                    )}
                                                </Button>
                                            </div>

                                            {discountApplied && (
                                                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="size-4 text-emerald-400" />
                                                            <span className="text-sm font-medium text-emerald-300">
                                                                Code{' '}
                                                                {
                                                                    discountApplied.code
                                                                }{' '}
                                                                applied
                                                            </span>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setDiscountCode(
                                                                    '',
                                                                );
                                                                setDiscountApplied(
                                                                    null,
                                                                );
                                                            }}
                                                            className="text-white/60 hover:text-white"
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {errors.discount_code && (
                                                <p className="text-sm text-red-400">
                                                    {errors.discount_code}
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                <Card className="border-white/10 bg-white/5">
                                    <CardHeader>
                                        <CardTitle className="text-white">
                                            Payment Method
                                        </CardTitle>
                                        <CardDescription className="text-white/60">
                                            Select a saved card or add a new one
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
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
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="lg:col-span-1">
                                <Card className="sticky top-4 border-white/10 bg-white/5">
                                    <CardHeader>
                                        <CardTitle className="text-white">
                                            Order Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CheckoutSummary
                                            items={[
                                                {
                                                    label: plan.name,
                                                    amount: basePrice,
                                                    currency: plan.currency,
                                                },
                                            ]}
                                            subtotal={basePrice}
                                            discount={
                                                discountApplied
                                                    ? {
                                                          label: `Discount (${discountApplied.code})`,
                                                          amount: discountAmount,
                                                      }
                                                    : undefined
                                            }
                                            total={finalPrice}
                                            currency={plan.currency}
                                        />
                                        {!is_gift && (
                                            <div className="mt-4 space-y-2 text-xs text-white/60">
                                                <div className="flex items-center justify-between">
                                                    <span>Billing</span>
                                                    <span>
                                                        {billingType ===
                                                        'recurring'
                                                            ? `${billingInterval === 'yearly' ? 'Yearly' : 'Monthly'} (Recurring)`
                                                            : 'One-Time'}
                                                    </span>
                                                </div>
                                                {billingType ===
                                                    'recurring' && (
                                                    <p className="text-xs text-white/50">
                                                        {billingInterval ===
                                                        'yearly'
                                                            ? 'Billed annually. Cancel anytime.'
                                                            : 'Billed monthly. Cancel anytime.'}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        {is_gift && (
                                            <div className="mt-4 space-y-2 text-xs text-white/60">
                                                <div className="flex items-center justify-between">
                                                    <span>Billing</span>
                                                    <span>One-Time Gift</span>
                                                </div>
                                                <p className="text-xs text-white/50">
                                                    This is a one-time gift
                                                    membership purchase.
                                                </p>
                                            </div>
                                        )}
                                        <Button
                                            type="submit"
                                            className="mt-6 w-full"
                                            disabled={
                                                isSubmitting ||
                                                (!selectedPaymentMethodId &&
                                                    ccbill_client_accnum &&
                                                    ccbill_client_subacc)
                                            }
                                            size="lg"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    {is_gift
                                                        ? 'Complete Gift Purchase'
                                                        : 'Complete Purchase'}
                                                </>
                                            )}
                                        </Button>

                                        {errors.plan_id && (
                                            <p className="mt-2 text-sm text-red-400">
                                                {errors.plan_id}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </AppLayout>
    );
}

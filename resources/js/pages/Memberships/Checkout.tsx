import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import membershipsRoutes from '@/routes/memberships';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Crown, Loader2, Tag } from 'lucide-react';
import { FormEvent, useState } from 'react';

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

type CheckoutPageProps = {
    plan: MembershipPlan;
};

export default function MembershipCheckout({ plan }: CheckoutPageProps) {
    const [billingType, setBillingType] = useState<'recurring' | 'one_time'>('recurring');
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
    const [discountCode, setDiscountCode] = useState('');
    const [discountApplied, setDiscountApplied] = useState<{
        code: string;
        amount: number;
        final_price: number;
    } | null>(null);
    const [applyingDiscount, setApplyingDiscount] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        plan_id: plan.id,
        billing_type: 'recurring',
        billing_interval: 'monthly',
        discount_code: undefined as string | undefined,
        gateway: 'fake',
        method: 'card',
    });

    const formatPrice = (cents: number, currency: string = 'USD'): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(cents / 100);
    };

    const basePrice = billingInterval === 'yearly' ? plan.yearly_price : plan.monthly_price;
    const finalPrice = discountApplied ? discountApplied.final_price : basePrice;
    const discountAmount = discountApplied ? discountApplied.amount : 0;

    const applyDiscount = async () => {
        if (!discountCode.trim()) {
            return;
        }

        setApplyingDiscount(true);
        try {
            const response = await fetch(membershipsRoutes.applyDiscount().url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    code: discountCode,
                    plan_id: plan.id,
                    price: basePrice,
                }),
            });

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

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!plan.allows_recurring && billingType === 'recurring') {
            alert('Recurring billing is not available for this plan');
            return;
        }

        if (!plan.allows_one_time && billingType === 'one_time') {
            alert('One-time purchase is not available for this plan');
            return;
        }

        // Update form data with current state
        setData({
            ...data,
            billing_type: billingType,
            billing_interval: billingInterval,
            discount_code: discountApplied?.code || undefined,
        });

        post(membershipsRoutes.purchase().url, {
            preserveScroll: true,
            onSuccess: (page) => {
                // Payment intent will be in the response
                // Redirect to payment gateway or show success
                if (page.props.payment_intent) {
                    // Handle payment intent (e.g., redirect to Stripe checkout)
                    console.log('Payment intent created:', page.props.payment_intent);
                }
            },
        });
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
                        <h1 className="text-3xl font-bold tracking-tight text-white">Complete Your Purchase</h1>
                        <p className="mt-2 text-sm text-white/70">
                            Review your membership selection and complete payment
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-white/10 bg-white/5">
                                <CardHeader>
                                    <CardTitle className="text-white">Membership Plan</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Crown className="size-5 text-amber-400" />
                                        <div>
                                            <p className="font-semibold text-white">{plan.name}</p>
                                            {plan.description && (
                                                <p className="text-sm text-white/60">{plan.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    {plan.features && Object.keys(plan.features).length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-white/70">Features included:</p>
                                            <ul className="space-y-2">
                                                {Object.entries(plan.features).map(([key, value]) => (
                                                    <li key={key} className="flex items-start gap-2 text-sm text-white/80">
                                                        <CheckCircle2 className="mt-0.5 size-4 text-emerald-300" />
                                                        <span>{value}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-white/10 bg-white/5">
                                <CardHeader>
                                    <CardTitle className="text-white">Billing Options</CardTitle>
                                    <CardDescription className="text-white/60">
                                        Choose how you want to be billed
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <RadioGroup
                                        value={billingType}
                                        onValueChange={(value) => {
                                            setBillingType(value as 'recurring' | 'one_time');
                                        }}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="recurring" id="recurring" />
                                            <Label htmlFor="recurring" className="text-white">
                                                Recurring Subscription
                                            </Label>
                                        </div>
                                        {billingType === 'recurring' && (
                                            <div className="ml-6 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant={billingInterval === 'monthly' ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => {
                                                            setBillingInterval('monthly');
                                                        }}
                                                    >
                                                        Monthly
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={billingInterval === 'yearly' ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => {
                                                            setBillingInterval('yearly');
                                                        }}
                                                    >
                                                        Yearly
                                                        <Badge variant="secondary" className="ml-2 bg-emerald-500/20 text-emerald-400">
                                                            Save 2 months
                                                        </Badge>
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="one_time" id="one_time" />
                                            <Label htmlFor="one_time" className="text-white">
                                                One-Time Purchase
                                            </Label>
                                        </div>
                                    </RadioGroup>

                                    {errors.billing_type && (
                                        <p className="text-sm text-red-400">{errors.billing_type}</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-white/10 bg-white/5">
                                <CardHeader>
                                    <CardTitle className="text-white">Discount Code</CardTitle>
                                    <CardDescription className="text-white/60">
                                        Have a discount code? Enter it here
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input
                                            value={discountCode}
                                            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                            placeholder="Enter code"
                                            className="bg-white/5 border-white/10 text-white"
                                            disabled={applyingDiscount || !!discountApplied}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={applyDiscount}
                                            disabled={applyingDiscount || !discountCode.trim() || !!discountApplied}
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
                                                        Code {discountApplied.code} applied
                                                    </span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                setDiscountCode('');
                                                setDiscountApplied(null);
                                                    }}
                                                    className="text-white/60 hover:text-white"
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {errors.discount_code && (
                                        <p className="text-sm text-red-400">{errors.discount_code}</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-1">
                            <Card className="border-white/10 bg-white/5 sticky top-4">
                                <CardHeader>
                                    <CardTitle className="text-white">Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-white/70">Plan</span>
                                            <span className="font-medium text-white">{plan.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-white/70">Billing</span>
                                            <span className="font-medium text-white">
                                                {billingType === 'recurring'
                                                    ? `${billingInterval === 'yearly' ? 'Yearly' : 'Monthly'} (Recurring)`
                                                    : 'One-Time'}
                                            </span>
                                        </div>
                                    </div>

                                    <Separator className="bg-white/10" />

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-white/70">Subtotal</span>
                                            <span className="text-white">{formatPrice(basePrice, plan.currency)}</span>
                                        </div>
                                        {discountApplied && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-emerald-400">Discount ({discountApplied.code})</span>
                                                <span className="text-emerald-400">
                                                    -{formatPrice(discountAmount, plan.currency)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <Separator className="bg-white/10" />

                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-semibold text-white">Total</span>
                                        <span className="text-2xl font-bold text-white">
                                            {formatPrice(finalPrice, plan.currency)}
                                        </span>
                                    </div>

                                    {billingType === 'recurring' && (
                                        <p className="text-xs text-white/50">
                                            {billingInterval === 'yearly'
                                                ? 'Billed annually. Cancel anytime.'
                                                : 'Billed monthly. Cancel anytime.'}
                                        </p>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={processing}
                                        size="lg"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 size-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Complete Purchase
                                            </>
                                        )}
                                    </Button>

                                    {errors.plan_id && (
                                        <p className="text-sm text-red-400">{errors.plan_id}</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}


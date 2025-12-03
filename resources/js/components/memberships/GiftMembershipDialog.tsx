import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { getCsrfToken } from '@/lib/csrf';
import { router } from '@inertiajs/react';
import { Gift, Loader2 } from 'lucide-react';
import { useState } from 'react';

type MembershipPlan = {
    id: number;
    uuid: string;
    name: string;
    slug: string;
    description: string;
    monthly_price: number;
    currency: string;
    one_time_duration_days: number;
};

interface GiftMembershipDialogProps {
    recipientId: number;
    recipientName: string;
    plans: MembershipPlan[];
    trigger: React.ReactNode;
}

export function GiftMembershipDialog({
    recipientId,
    recipientName,
    plans,
    trigger,
}: GiftMembershipDialogProps) {
    const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(
        plans[0] ?? null,
    );
    const [message, setMessage] = useState('');
    const [step, setStep] = useState<'plan' | 'checkout'>('plan');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const formatPrice = (price: number, currency: string = 'USD'): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price / 100);
    };

    const resetOnOpen = () => {
        setStep('plan');
        setMessage('');
        setSelectedPlan(plans[0] ?? null);
        setError(null);
        setIsProcessing(false);
    };

    const handleGiftPurchase = async () => {
        if (!selectedPlan) {
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const csrfToken = getCsrfToken();
            const response = await fetch('/memberships/gift', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
                },
                credentials: 'include',
                body: JSON.stringify({
                    recipient_id: recipientId,
                    plan_id: selectedPlan.id,
                    message: message.trim() || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage =
                    data.message ||
                    data.errors?.recipient_id?.[0] ||
                    data.errors?.plan_id?.[0] ||
                    'Failed to process gift membership. Please try again.';
                throw new Error(errorMessage);
            }

            // If free membership, redirect to success
            if (data.free_membership) {
                router.visit('/upgrade', {
                    data: {
                        gift_success: true,
                        recipient_name: recipientName,
                        plan_name: selectedPlan.name,
                    },
                });
                return;
            }

            // Otherwise, redirect to checkout with payment intent
            // Note: recipient info is stored in payment intent metadata, not in URL
            if (data.payment_intent) {
                router.visit(`/memberships/checkout/${selectedPlan.slug}`, {
                    data: {
                        payment_intent_id: data.payment_intent.id,
                    },
                });
            }
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Failed to process gift membership. Please try again.';
            setError(message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog onOpenChange={(open) => open && resetOnOpen()}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="border-white/10 bg-neutral-950 text-white sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">
                        {step === 'plan' ? 'Gift a Membership' : 'Confirm Gift'}
                    </DialogTitle>
                    <DialogDescription className="text-white/65">
                        {step === 'plan'
                            ? `Give ${recipientName} the gift of membership. They'll receive access immediately.`
                            : 'Review your gift and complete the purchase.'}
                    </DialogDescription>
                </DialogHeader>

                {step === 'plan' && (
                    <>
                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {plans.map((plan) => {
                                    const isSelected =
                                        selectedPlan?.id === plan.id;
                                    const durationText =
                                        plan.one_time_duration_days === 30
                                            ? '1 month'
                                            : plan.one_time_duration_days === 90
                                              ? '3 months'
                                              : plan.one_time_duration_days ===
                                                  365
                                                ? '1 year'
                                                : `${plan.one_time_duration_days} days`;

                                    return (
                                        <button
                                            key={plan.id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedPlan(plan)
                                            }
                                            className={`flex h-full flex-col gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                                                isSelected
                                                    ? 'border-amber-400/70 bg-amber-400/10 shadow-[0_24px_55px_-30px_rgba(249,115,22,0.65)]'
                                                    : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-semibold text-white">
                                                    {plan.name}
                                                </p>
                                                <Badge className="rounded-full border-white/15 bg-white/10 text-xs text-white/70">
                                                    {formatPrice(
                                                        plan.monthly_price,
                                                        plan.currency,
                                                    )}
                                                </Badge>
                                            </div>
                                            <p className="text-xs leading-relaxed text-white/65">
                                                {plan.description}
                                            </p>
                                            <p className="text-xs text-white/50">
                                                Duration: {durationText}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs tracking-[0.35em] text-white/50 uppercase">
                                    Optional Message
                                </p>
                                <Textarea
                                    placeholder={`Add a personal message for ${recipientName}...`}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    maxLength={500}
                                    className="min-h-[100px] rounded-xl border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                                />
                                <p className="text-xs text-white/50">
                                    {message.length}/500 characters
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="items-center justify-between border-t border-white/10 pt-4 sm:flex-row">
                            <p className="text-xs text-white/60">
                                {selectedPlan
                                    ? `Gifting ${selectedPlan.name} to ${recipientName}`
                                    : 'Select a membership plan to continue.'}
                            </p>
                            <Button
                                className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] hover:scale-[1.02]"
                                disabled={!selectedPlan}
                                onClick={() => setStep('checkout')}
                            >
                                Continue
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {step === 'checkout' && selectedPlan && (
                    <>
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            Gift Recipient
                                        </p>
                                        <p className="text-xs text-white/60">
                                            {recipientName}
                                        </p>
                                    </div>
                                    <Gift className="size-8 text-amber-400" />
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-white">
                                        Membership Plan
                                    </p>
                                    <p className="text-xs text-white/70">
                                        {selectedPlan.name}
                                    </p>
                                    <p className="text-lg font-bold text-amber-400">
                                        {formatPrice(
                                            selectedPlan.monthly_price,
                                            selectedPlan.currency,
                                        )}
                                    </p>
                                </div>
                            </div>

                            {message.trim() && (
                                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <p className="text-xs tracking-[0.35em] text-white/50 uppercase">
                                        Your Message
                                    </p>
                                    <p className="mt-2 text-sm text-white/70">
                                        {message}
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                                    {error}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <Button
                                variant="ghost"
                                className="rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                onClick={() => setStep('plan')}
                                disabled={isProcessing}
                            >
                                ← Back
                            </Button>
                            <Button
                                className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] hover:scale-[1.02] disabled:opacity-50"
                                onClick={handleGiftPurchase}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    `Gift ${formatPrice(
                                        selectedPlan.monthly_price,
                                        selectedPlan.currency,
                                    )}`
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

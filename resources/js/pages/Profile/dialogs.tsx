import { useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    type SubscriptionTier,
    type TipOption,
} from '@/pages/Profile/types';

type CardMethod = {
    id: string;
    brand: string;
    last4: string;
    expiry: string;
    accent: string;
};

type AltPaymentMethod = {
    id: string;
    label: string;
    accent: string;
    textColor?: string;
};

const storedCards: CardMethod[] = [
    {
        id: 'card-visa',
        brand: 'Visa',
        last4: '4242',
        expiry: '08/27',
        accent: '#2563EB',
    },
    {
        id: 'card-amex',
        brand: 'Amex',
        last4: '8431',
        expiry: '03/28',
        accent: '#1E3A8A',
    },
];

const alternativePayments: AltPaymentMethod[] = [
    {
        id: 'cashapp',
        label: 'Cash App',
        accent: '#00C244',
    },
    {
        id: 'venmo',
        label: 'Venmo',
        accent: '#3D95CE',
    },
    {
        id: 'interac',
        label: 'Interac',
        accent: '#FFCB05',
        textColor: '#111111',
    },
];

type CheckoutState = {
    cardId: string | null;
    altId: string | null;
};

interface SubscribeDialogProps {
    tiers: SubscriptionTier[];
    trigger: React.ReactNode;
}

export function SubscribeDialog({ tiers, trigger }: SubscribeDialogProps) {
    const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(
        tiers[0] ?? null,
    );
    const [step, setStep] = useState<'tier' | 'checkout'>('tier');
    const [checkoutState, setCheckoutState] = useState<CheckoutState>({
        cardId: storedCards[0]?.id ?? null,
        altId: null,
    });

    const activePaymentLabel = useMemo(() => {
        if (checkoutState.altId) {
            const found = alternativePayments.find(
                (method) => method.id === checkoutState.altId,
            );
            return found?.label ?? 'Alternative payment';
        }
        if (checkoutState.cardId) {
            const found = storedCards.find(
                (card) => card.id === checkoutState.cardId,
            );
            return found
                ? `${found.brand} •••• ${found.last4}`
                : 'Saved card';
        }
        return 'Payment method';
    }, [checkoutState]);

    const resetOnOpen = () => {
        setStep('tier');
        setCheckoutState({
            cardId: storedCards[0]?.id ?? null,
            altId: null,
        });
        setSelectedTier(tiers[0] ?? null);
    };

    return (
        <Dialog onOpenChange={(open) => open && resetOnOpen()}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="border-white/10 bg-neutral-950 text-white sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">
                        {step === 'tier'
                            ? 'Choose your membership'
                            : 'Checkout'}
                    </DialogTitle>
                    <DialogDescription className="text-white/65">
                        {step === 'tier'
                            ? 'Unlock exclusive drops, analytics, and circle access. Swap tiers anytime.'
                            : 'Select how you want to pay and confirm your membership.'}
                    </DialogDescription>
                </DialogHeader>

                {step === 'tier' && (
                    <>
                        <div className="grid gap-4 sm:grid-cols-3">
                            {tiers.map((tier) => {
                                const isSelected =
                                    selectedTier?.name === tier.name;
                                return (
                                    <button
                                        key={tier.name}
                                        type="button"
                                        onClick={() => setSelectedTier(tier)}
                                        className={`flex h-full flex-col gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                                            isSelected
                                                ? 'border-amber-400/70 bg-amber-400/10 shadow-[0_24px_55px_-30px_rgba(249,115,22,0.65)]'
                                                : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-white">
                                                {tier.name}
                                            </p>
                                            <Badge className="rounded-full border-white/15 bg-white/10 text-xs text-white/70">
                                                {tier.price}
                                            </Badge>
                                        </div>
                                        <p className="text-xs leading-relaxed text-white/65">
                                            {tier.description}
                                        </p>
                                        <ul className="space-y-1 text-xs text-white/60">
                                            {tier.perks.map((perk) => (
                                                <li
                                                    key={perk}
                                                    className="flex items-start gap-2"
                                                >
                                                    <span className="mt-1 size-1.5 rounded-full bg-amber-400" />
                                                    <span>{perk}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </button>
                                );
                            })}
                        </div>

                        <DialogFooter className="items-center justify-between border-t border-white/10 pt-4 sm:flex-row">
                            <p className="text-xs text-white/60">
                                {selectedTier
                                    ? `You're choosing the ${selectedTier.name} membership.`
                                    : 'Select a tier to continue.'}
                            </p>
                            <Button
                                className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] hover:scale-[1.02]"
                                disabled={!selectedTier}
                                onClick={() => setStep('checkout')}
                            >
                                Continue to checkout
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {step === 'checkout' && (
                    <>
                        <div className="space-y-6">
                            <div>
                                <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                                    Saved cards
                                </p>
                                <div className="mt-2 space-y-3">
                                    {storedCards.map((card) => {
                                        const isSelected =
                                            checkoutState.cardId === card.id &&
                                            checkoutState.altId === null;
                                        return (
                                            <button
                                                key={card.id}
                                                type="button"
                                                onClick={() =>
                                                    setCheckoutState({
                                                        cardId: card.id,
                                                        altId: null,
                                                    })
                                                }
                                                className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                                                    isSelected
                                                        ? 'border-amber-400/70 bg-amber-400/10 shadow-[0_24px_55px_-30px_rgba(249,115,22,0.65)]'
                                                        : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                                                        style={{
                                                            backgroundColor:
                                                                card.accent,
                                                        }}
                                                    >
                                                        {card.brand[0]}
                                                    </span>
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">
                                                            {card.brand} ••••{' '}
                                                            {card.last4}
                                                        </p>
                                                        <p className="text-xs text-white/60">
                                                            Expires {card.expiry}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-xs uppercase tracking-[0.35em] text-amber-300">
                                                    {isSelected
                                                        ? 'Selected'
                                                        : 'Choose'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                    <button
                                        type="button"
                                        className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
                                    >
                                        + Add new card
                                    </button>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                                    Alternative payments
                                </p>
                                <div className="mt-2 flex flex-wrap gap-3">
                                    {alternativePayments.map((method) => {
                                        const isSelected =
                                            checkoutState.altId === method.id;
                                        return (
                                            <button
                                                key={method.id}
                                                type="button"
                                                onClick={() =>
                                                    setCheckoutState({
                                                        cardId: null,
                                                        altId: method.id,
                                                    })
                                                }
                                                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                                                    isSelected
                                                        ? 'border-white/70 shadow-[0_24px_55px_-30px_rgba(249,115,22,0.65)]'
                                                        : 'border-white/15'
                                                }`}
                                                style={{
                                                    backgroundColor:
                                                        method.accent,
                                                    color:
                                                        method.textColor ??
                                                        '#FFFFFF',
                                                }}
                                            >
                                                {method.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <Button
                                variant="ghost"
                                className="rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                onClick={() => setStep('tier')}
                            >
                                ← Back
                            </Button>
                            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                                <p className="text-xs text-white/60 sm:mr-4 sm:text-right">
                                    {selectedTier
                                        ? `${selectedTier.name} • ${selectedTier.price} via ${activePaymentLabel}`
                                        : activePaymentLabel}
                                </p>
                                <Button className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] hover:scale-[1.02]">
                                    Confirm subscription
                                </Button>
                            </div>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

interface TipDialogProps {
    options: TipOption[];
    trigger: React.ReactNode;
}

export function TipDialog({ options, trigger }: TipDialogProps) {
    const [selectedOption, setSelectedOption] = useState<TipOption | null>(
        options[1] ?? options[0] ?? null,
    );
    const [customAmount, setCustomAmount] = useState('');
    const [step, setStep] = useState<'amount' | 'checkout'>('amount');
    const [checkoutState, setCheckoutState] = useState<CheckoutState>({
        cardId: storedCards[0]?.id ?? null,
        altId: null,
    });

    const effectiveAmount =
        customAmount.trim() !== ''
            ? `$${customAmount.trim()}`
            : selectedOption?.amount ?? '$0';

    const activePaymentLabel = useMemo(() => {
        if (checkoutState.altId) {
            const found = alternativePayments.find(
                (method) => method.id === checkoutState.altId,
            );
            return found?.label ?? 'Alternative payment';
        }
        if (checkoutState.cardId) {
            const found = storedCards.find(
                (card) => card.id === checkoutState.cardId,
            );
            return found
                ? `${found.brand} •••• ${found.last4}`
                : 'Saved card';
        }
        return 'Payment method';
    }, [checkoutState]);

    const resetOnOpen = () => {
        setStep('amount');
        setCheckoutState({
            cardId: storedCards[0]?.id ?? null,
            altId: null,
        });
        setCustomAmount('');
        setSelectedOption(options[1] ?? options[0] ?? null);
    };

    return (
        <Dialog onOpenChange={(open) => open && resetOnOpen()}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="border-white/10 bg-neutral-950 text-white sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">
                        {step === 'amount' ? 'Send a tip' : 'Checkout'}
                    </DialogTitle>
                    <DialogDescription className="text-white/65">
                        {step === 'amount'
                            ? 'Fuel the next ritual, unlock bonuses, and show some love.'
                            : 'Pick how you want to pay and confirm the tip.'}
                    </DialogDescription>
                </DialogHeader>

                {step === 'amount' && (
                    <>
                        <div className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                {options.map((option) => {
                                    const isSelected =
                                        selectedOption?.amount ===
                                            option.amount &&
                                        customAmount.trim() === '';
                                    return (
                                        <button
                                            key={option.amount}
                                            type="button"
                                            onClick={() => {
                                                setSelectedOption(option);
                                                setCustomAmount('');
                                            }}
                                            className={`flex flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition ${
                                                isSelected
                                                    ? 'border-amber-400/70 bg-amber-400/10 shadow-[0_24px_55px_-30px_rgba(249,115,22,0.65)]'
                                                    : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                                            }`}
                                        >
                                            <span className="text-base font-semibold text-white">
                                                {option.amount}
                                            </span>
                                            <span className="text-xs text-white/65">
                                                {option.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                                    Custom amount
                                </p>
                                <Input
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="Enter amount"
                                    value={customAmount}
                                    onChange={(event) => {
                                        setCustomAmount(event.target.value);
                                        if (event.target.value.trim() !== '') {
                                            setSelectedOption(null);
                                        }
                                    }}
                                    className="h-11 rounded-xl border-white/15 bg-black/40 text-sm text-white placeholder:text-white/40"
                                />
                            </div>
                        </div>

                        <DialogFooter className="items-center justify-between border-t border-white/10 pt-4 sm:flex-row">
                            <p className="text-xs text-white/60">
                                {customAmount.trim() !== ''
                                    ? 'Custom tip selected.'
                                    : selectedOption
                                      ? `Sending ${selectedOption.amount}: ${selectedOption.label}`
                                      : 'Choose a quick tip or enter a custom amount.'}
                            </p>
                            <Button
                                className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] hover:scale-[1.02]"
                                disabled={
                                    !selectedOption &&
                                    customAmount.trim() === ''
                                }
                                onClick={() => setStep('checkout')}
                            >
                                Continue
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {step === 'checkout' && (
                    <>
                        <div className="space-y-6">
                            <div>
                                <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                                    Saved cards
                                </p>
                                <div className="mt-2 space-y-3">
                                    {storedCards.map((card) => {
                                        const isSelected =
                                            checkoutState.cardId === card.id &&
                                            checkoutState.altId === null;
                                        return (
                                            <button
                                                key={card.id}
                                                type="button"
                                                onClick={() =>
                                                    setCheckoutState({
                                                        cardId: card.id,
                                                        altId: null,
                                                    })
                                                }
                                                className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                                                    isSelected
                                                        ? 'border-amber-400/70 bg-amber-400/10 shadow-[0_24px_55px_-30px_rgba(249,115,22,0.65)]'
                                                        : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                                                        style={{
                                                            backgroundColor:
                                                                card.accent,
                                                        }}
                                                    >
                                                        {card.brand[0]}
                                                    </span>
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">
                                                            {card.brand} ••••{' '}
                                                            {card.last4}
                                                        </p>
                                                        <p className="text-xs text-white/60">
                                                            Expires {card.expiry}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-xs uppercase tracking-[0.35em] text-amber-300">
                                                    {isSelected
                                                        ? 'Selected'
                                                        : 'Choose'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                                    Alternative payments
                                </p>
                                <div className="mt-2 flex flex-wrap gap-3">
                                    {alternativePayments.map((method) => {
                                        const isSelected =
                                            checkoutState.altId === method.id;
                                        return (
                                            <button
                                                key={method.id}
                                                type="button"
                                                onClick={() =>
                                                    setCheckoutState({
                                                        cardId: null,
                                                        altId: method.id,
                                                    })
                                                }
                                                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                                                    isSelected
                                                        ? 'border-white/70 shadow-[0_24px_55px_-30px_rgba(249,115,22,0.65)]'
                                                        : 'border-white/15'
                                                }`}
                                                style={{
                                                    backgroundColor:
                                                        method.accent,
                                                    color:
                                                        method.textColor ??
                                                        '#FFFFFF',
                                                }}
                                            >
                                                {method.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <Button
                                variant="ghost"
                                className="rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white/70 hover:border-white/30 hover:bg-white/10 hover:text-white"
                                onClick={() => setStep('amount')}
                            >
                                ← Back
                            </Button>
                            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                                <p className="text-xs text-white/60 sm:mr-4 sm:text-right">
                                    Tip {effectiveAmount} via {activePaymentLabel}
                                </p>
                                <Button className="rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(249,115,22,0.45)] hover:scale-[1.02]">
                                    Send {effectiveAmount}
                                </Button>
                            </div>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}


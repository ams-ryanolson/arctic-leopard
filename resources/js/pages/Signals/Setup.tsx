import {
    LocationAutocomplete,
    type LocationSuggestion,
} from '@/components/location-autocomplete';
import BankAccount from '@/components/payout-methods/BankAccount';
import CryptoWallet from '@/components/payout-methods/CryptoWallet';
import PushToCard from '@/components/payout-methods/PushToCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import VerificationFlow from '@/components/verification/VerificationFlow';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    ArrowRight,
    Building2,
    CheckCircle2,
    CreditCard,
    Gift,
    Loader2,
    Rocket,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type VerificationStatus = {
    status: string | null;
    provider?: string;
    provider_applicant_id?: string | null;
    verified_at?: string | null;
    expires_at?: string | null;
    renewal_required_at?: string | null;
    is_expired?: boolean;
    is_in_grace_period?: boolean;
    needs_renewal?: boolean;
    created_at?: string | null;
    can_retry?: boolean;
} | null;

type StepStatus = {
    completed: boolean;
    required: boolean;
    current_count?: number;
    required_count?: number;
};

type StepsStatus = {
    id_verification: StepStatus;
    payout_details: StepStatus;
    subscription_rates: StepStatus;
    wishlist_items: StepStatus;
};

interface SignalsSetupProps {
    verificationStatus: VerificationStatus;
    stepsStatus: StepsStatus;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Signals',
        href: '/signals',
    },
    {
        title: 'Setup',
        href: '/signals/setup',
    },
];

export default function SignalsSetup({
    verificationStatus,
    stepsStatus,
}: SignalsSetupProps) {
    // Find first incomplete step on mount
    const getFirstIncompleteStep = (): number => {
        const stepKeys = [
            'id_verification',
            'payout_details',
            'subscription_rates',
            'wishlist_items',
        ] as const;
        for (let i = 0; i < stepKeys.length; i++) {
            if (!stepsStatus[stepKeys[i]].completed) {
                return i;
            }
        }
        return 0; // All completed
    };

    const [currentStep, setCurrentStep] = useState<number>(
        getFirstIncompleteStep,
    );

    // Payout form state
    const [legalFirstName, setLegalFirstName] = useState('');
    const [legalLastName, setLegalLastName] = useState('');
    const [addressQuery, setAddressQuery] = useState('');
    const [selectedAddress, setSelectedAddress] =
        useState<LocationSuggestion | null>(null);
    const [selectedPayoutMethod, setSelectedPayoutMethod] = useState<
        'bank' | 'crypto' | 'card' | null
    >(null);

    const handleAddressQueryChange = useCallback((value: string) => {
        setAddressQuery(value);
        if (!value.trim()) {
            setSelectedAddress(null);
        }
    }, []);

    const handleAddressSelect = useCallback(
        (suggestion: LocationSuggestion) => {
            setSelectedAddress(suggestion);
            setAddressQuery(suggestion.label);
        },
        [],
    );

    // Auto-advance when a step is completed
    useEffect(() => {
        const stepKeys = [
            'id_verification',
            'payout_details',
            'subscription_rates',
            'wishlist_items',
        ] as const;
        const completedIndex = stepKeys.findIndex(
            (key) => stepsStatus[key].completed,
        );

        // If current step is completed, move to next incomplete step
        if (
            completedIndex === currentStep &&
            stepsStatus[stepKeys[currentStep]].completed
        ) {
            const nextIncomplete = stepKeys.findIndex(
                (key, idx) => idx > currentStep && !stepsStatus[key].completed,
            );
            if (nextIncomplete !== -1) {
                setCurrentStep(nextIncomplete);
            }
        }
    }, [stepsStatus, currentStep]);

    const steps = [
        {
            id: 'id_verification',
            title: 'Verify Your Identity',
            shortDescription: 'Quick ID check to verify who you are',
            description:
                "We need to verify your identity to keep the platform safe. This is a quick process that takes just 2-3 minutes. You'll need a government-issued ID and take a quick selfie.",
            whyItMatters:
                'Required by law and keeps everyone safe on the platform.',
            icon: ShieldCheck,
            status: stepsStatus.id_verification,
            component: 'verification',
        },
        {
            id: 'payout_details',
            title: 'Add Payout Details',
            shortDescription: 'How you want to receive your earnings',
            description:
                "Set up how you want to get paid! Add your bank account, PayPal, or other payment method. We'll send your earnings here every month.",
            whyItMatters:
                "You can't get paid without this! Set it up now so money flows to you automatically.",
            icon: CreditCard,
            status: stepsStatus.payout_details,
            component: 'payout',
        },
        {
            id: 'subscription_rates',
            title: 'Setup Subscription Rates',
            shortDescription: 'Set your monthly subscription prices',
            description:
                'Decide how much fans pay each month to subscribe to you. You can create multiple tiers (like Basic, Premium, VIP) with different prices and benefits.',
            whyItMatters:
                'This is how you make money! Set your prices so fans know what to pay.',
            icon: Sparkles,
            status: stepsStatus.subscription_rates,
            component: 'subscription',
        },
        {
            id: 'wishlist_items',
            title: 'Create 3 Wishlist Items',
            shortDescription: 'Let fans buy things for you',
            description:
                'Add items you want—gift cards, equipment, outfits, experiences, whatever! Fans can purchase these for you. Be creative and make it fun!',
            whyItMatters:
                'Fans love buying things for creators they support. This is another way to earn!',
            icon: Gift,
            status: stepsStatus.wishlist_items,
            component: 'wishlist',
        },
    ];

    const allCompleted = steps.every((step) => step.status.completed);
    const activeStep = steps[currentStep];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Signals · Creator Setup" />

            <div className="space-y-8 text-white">
                {/* Header */}
                <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-violet-500/10 p-8 backdrop-blur-sm">
                    <div className="flex items-start gap-6">
                        <div className="flex size-16 items-center justify-center rounded-2xl border border-violet-400/40 bg-gradient-to-br from-violet-400/30 to-violet-500/20 p-4 shadow-[0_12px_30px_-18px_rgba(124,58,237,0.65)]">
                            <Rocket className="h-8 w-8 text-violet-300" />
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white">
                                    Creator Setup
                                </h1>
                                <p className="mt-3 text-lg leading-relaxed font-medium text-white/90">
                                    Let's get you set up to start earning!
                                    Follow these simple steps—we'll guide you
                                    through everything.
                                </p>
                                <p className="mt-2 text-sm leading-relaxed text-white/70">
                                    Each step takes just a few minutes. Complete
                                    them in order, and you'll be ready to start
                                    creating content and earning money.
                                </p>
                            </div>
                            {allCompleted && (
                                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-emerald-300" />
                                        <div>
                                            <p className="text-base font-semibold text-emerald-200">
                                                🎉 Congratulations! Setup
                                                Complete!
                                            </p>
                                            <p className="mt-1 text-sm text-emerald-200/80">
                                                You're all set! Head to your
                                                Signals dashboard to start
                                                creating and earning.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Progress Overview - Balanced Compact */}
                <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold text-white">
                                Setup Progress
                            </h2>
                            <span className="text-sm text-white/60">
                                {steps.filter((s) => s.status.completed).length}{' '}
                                of {steps.length} completed
                            </span>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {steps.map((step, index) => {
                                const StepIcon = step.icon;
                                const isCompleted = step.status.completed;
                                const isCurrent = index === currentStep;
                                const canAccess =
                                    index === 0 ||
                                    steps[index - 1].status.completed;

                                return (
                                    <div
                                        key={step.id}
                                        className={`rounded-xl border p-4 transition-all ${
                                            isCurrent
                                                ? 'border-violet-400/50 bg-gradient-to-br from-violet-400/15 via-violet-400/10 to-violet-500/5 shadow-[0_4px_15px_-8px_rgba(124,58,237,0.5)]'
                                                : isCompleted
                                                  ? 'border-emerald-400/40 bg-gradient-to-br from-emerald-400/12 via-emerald-400/8 to-emerald-500/4 shadow-[0_2px_8px_-4px_rgba(16,185,129,0.3)]'
                                                  : canAccess
                                                    ? 'border-blue-400/30 bg-gradient-to-br from-blue-400/8 via-blue-400/5 to-blue-500/3 hover:border-blue-400/40 hover:from-blue-400/12'
                                                    : 'border-amber-400/20 bg-gradient-to-br from-amber-400/5 via-amber-400/3 to-amber-500/2 opacity-70'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`mt-0.5 flex size-9 flex-shrink-0 items-center justify-center rounded-lg transition-all ${
                                                    isCompleted
                                                        ? 'border border-emerald-400/50 bg-gradient-to-br from-emerald-400/30 to-emerald-500/20 shadow-[0_2px_8px_-4px_rgba(16,185,129,0.4)]'
                                                        : isCurrent
                                                          ? 'border border-violet-400/50 bg-gradient-to-br from-violet-400/30 to-violet-500/20 shadow-[0_4px_12px_-6px_rgba(124,58,237,0.5)]'
                                                          : canAccess
                                                            ? 'border border-blue-400/40 bg-gradient-to-br from-blue-400/20 to-blue-500/15'
                                                            : 'border border-amber-400/30 bg-gradient-to-br from-amber-400/15 to-amber-500/10'
                                                }`}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                                                ) : isCurrent ? (
                                                    <Loader2 className="h-5 w-5 animate-spin text-violet-300" />
                                                ) : (
                                                    <StepIcon
                                                        className={`h-5 w-5 ${
                                                            canAccess
                                                                ? 'text-blue-300'
                                                                : 'text-amber-300/60'
                                                        }`}
                                                    />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <h3
                                                            className={`text-sm font-semibold ${
                                                                isCurrent
                                                                    ? 'text-violet-200'
                                                                    : isCompleted
                                                                      ? 'text-emerald-200'
                                                                      : canAccess
                                                                        ? 'text-blue-200'
                                                                        : 'text-amber-200/70'
                                                            }`}
                                                        >
                                                            Step {index + 1}:{' '}
                                                            {step.title}
                                                        </h3>
                                                        <p
                                                            className={`mt-1 text-xs leading-relaxed ${
                                                                canAccess
                                                                    ? 'text-white/75'
                                                                    : 'text-white/50'
                                                            }`}
                                                        >
                                                            {
                                                                step.shortDescription
                                                            }
                                                        </p>
                                                        {step.id ===
                                                            'wishlist_items' &&
                                                            step.status
                                                                .current_count !==
                                                                undefined &&
                                                            step.status
                                                                .current_count >
                                                                0 && (
                                                                <p className="mt-1.5 text-xs font-medium text-white/60">
                                                                    {
                                                                        step
                                                                            .status
                                                                            .current_count
                                                                    }
                                                                    /
                                                                    {
                                                                        step
                                                                            .status
                                                                            .required_count
                                                                    }{' '}
                                                                    items
                                                                </p>
                                                            )}
                                                    </div>
                                                    {isCompleted && (
                                                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                                                    )}
                                                </div>
                                                {isCurrent && (
                                                    <p className="mt-2 text-xs leading-tight font-medium text-violet-200/90">
                                                        You are here
                                                    </p>
                                                )}
                                                {isCompleted && !isCurrent && (
                                                    <p className="mt-2 text-xs leading-tight font-medium text-emerald-200/90">
                                                        Completed
                                                    </p>
                                                )}
                                                {!canAccess &&
                                                    !isCurrent &&
                                                    !isCompleted && (
                                                        <p className="mt-2 text-xs leading-tight font-medium text-amber-200/60 italic">
                                                            Complete step{' '}
                                                            {index} first to
                                                            unlock
                                                        </p>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Current Step Content */}
                <section className="rounded-3xl border border-violet-400/30 bg-gradient-to-br from-white/5 via-white/5 to-violet-500/10 p-8 shadow-[0_20px_50px_-20px_rgba(124,58,237,0.3)]">
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-xl border border-violet-400/40 bg-gradient-to-br from-violet-400/30 to-violet-500/20">
                                <activeStep.icon className="h-6 w-6 text-violet-300" />
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">
                                        {activeStep.title}
                                    </h2>
                                    <p className="mt-2 text-base leading-relaxed font-medium text-white/90">
                                        {activeStep.description}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-4">
                                    <p className="text-sm leading-relaxed text-blue-200/90">
                                        <span className="font-semibold text-blue-200">
                                            Why this matters:
                                        </span>{' '}
                                        {activeStep.whyItMatters}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-6">
                            {activeStep.component === 'verification' && (
                                <VerificationFlow
                                    mode="onboarding"
                                    verificationStatus={verificationStatus}
                                    onComplete={() => {
                                        // Reload page to check completion status and auto-advance
                                        router.reload({
                                            only: [
                                                'verificationStatus',
                                                'stepsStatus',
                                            ],
                                        });
                                    }}
                                />
                            )}

                            {activeStep.component === 'payout' && (
                                <div className="space-y-6">
                                    {/* Compliance Information Form */}
                                    <div className="space-y-6 rounded-xl border border-white/10 bg-white/5 p-6">
                                        <div>
                                            <h3 className="mb-2 text-lg font-semibold text-white">
                                                Legal Information
                                            </h3>
                                            <p className="text-sm leading-relaxed text-white/70">
                                                We need your legal name and
                                                address for compliance and tax
                                                purposes. This information is
                                                encrypted and secure.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="legal-first-name"
                                                    className="text-white/90"
                                                >
                                                    Legal First Name{' '}
                                                    <span className="text-red-400">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="legal-first-name"
                                                    type="text"
                                                    value={legalFirstName}
                                                    onChange={(e) =>
                                                        setLegalFirstName(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Enter your legal first name"
                                                    className="border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-blue-400/50"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor="legal-last-name"
                                                    className="text-white/90"
                                                >
                                                    Legal Last Name{' '}
                                                    <span className="text-red-400">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="legal-last-name"
                                                    type="text"
                                                    value={legalLastName}
                                                    onChange={(e) =>
                                                        setLegalLastName(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Enter your legal last name"
                                                    className="border-white/10 bg-white/5 text-white placeholder:text-white/40 focus:border-blue-400/50"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="legal-address"
                                                className="text-white/90"
                                            >
                                                Full Legal Address{' '}
                                                <span className="text-red-400">
                                                    *
                                                </span>
                                            </Label>
                                            <div className="relative">
                                                <LocationAutocomplete
                                                    value={addressQuery}
                                                    onChange={
                                                        handleAddressQueryChange
                                                    }
                                                    onSelect={
                                                        handleAddressSelect
                                                    }
                                                    includeAddresses={true}
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-white/60">
                                                Start typing your street
                                                address, city, and country
                                            </p>
                                        </div>

                                        {selectedAddress && (
                                            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                                                <p className="mb-2 text-xs font-semibold text-emerald-200">
                                                    Selected Address:
                                                </p>
                                                <div className="space-y-1 text-sm text-emerald-200/90">
                                                    <p className="font-medium">
                                                        {selectedAddress.label}
                                                    </p>
                                                    {selectedAddress.city && (
                                                        <p className="text-xs text-emerald-200/70">
                                                            {[
                                                                selectedAddress.city,
                                                                selectedAddress.region,
                                                                selectedAddress.country,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Payout Method Selection */}
                                    <div className="space-y-4">
                                        {!selectedPayoutMethod ? (
                                            <>
                                                <div>
                                                    <h3 className="mb-2 text-lg font-semibold text-white">
                                                        Payout Methods
                                                    </h3>
                                                    <p className="text-sm leading-relaxed text-white/70">
                                                        Choose your primary
                                                        payout method. You can
                                                        add more payout methods
                                                        later and change them
                                                        anytime.
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                    {/* Bank Account */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedPayoutMethod(
                                                                'bank',
                                                            )
                                                        }
                                                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-blue-500/5 p-6 text-left transition-all hover:border-blue-400/40 hover:from-blue-400/10 hover:shadow-[0_8px_25px_-15px_rgba(59,130,246,0.4)]"
                                                    >
                                                        <div className="flex flex-col gap-4">
                                                            <div className="flex size-12 items-center justify-center rounded-xl border border-blue-400/40 bg-gradient-to-br from-blue-400/20 to-blue-500/15 transition-all group-hover:from-blue-400/30 group-hover:to-blue-500/20">
                                                                <Building2 className="h-6 w-6 text-blue-300" />
                                                            </div>
                                                            <div>
                                                                <h3 className="mb-1 text-base font-semibold text-white">
                                                                    Bank Account
                                                                </h3>
                                                                <p className="text-xs leading-relaxed text-white/70">
                                                                    Direct
                                                                    deposit to
                                                                    your bank
                                                                    account.
                                                                    Most
                                                                    reliable
                                                                    option for
                                                                    regular
                                                                    payouts.
                                                                </p>
                                                            </div>
                                                            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-blue-300/80">
                                                                <span>
                                                                    Add Bank
                                                                    Account
                                                                </span>
                                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                            </div>
                                                        </div>
                                                    </button>

                                                    {/* Crypto */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedPayoutMethod(
                                                                'crypto',
                                                            )
                                                        }
                                                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-purple-500/5 p-6 text-left transition-all hover:border-purple-400/40 hover:from-purple-400/10 hover:shadow-[0_8px_25px_-15px_rgba(168,85,247,0.4)]"
                                                    >
                                                        <div className="flex flex-col gap-4">
                                                            <div className="flex size-12 items-center justify-center rounded-xl border border-purple-400/40 bg-gradient-to-br from-purple-400/20 to-purple-500/15 transition-all group-hover:from-purple-400/30 group-hover:to-purple-500/20">
                                                                <Wallet className="h-6 w-6 text-purple-300" />
                                                            </div>
                                                            <div>
                                                                <h3 className="mb-1 text-base font-semibold text-white">
                                                                    Crypto
                                                                </h3>
                                                                <p className="text-xs leading-relaxed text-white/70">
                                                                    Receive
                                                                    payments in
                                                                    cryptocurrency.
                                                                    Fast,
                                                                    secure, and
                                                                    decentralized.
                                                                </p>
                                                            </div>
                                                            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-purple-300/80">
                                                                <span>
                                                                    Add Crypto
                                                                    Wallet
                                                                </span>
                                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                            </div>
                                                        </div>
                                                    </button>

                                                    {/* Push to Card */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectedPayoutMethod(
                                                                'card',
                                                            )
                                                        }
                                                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-emerald-500/5 p-6 text-left transition-all hover:border-emerald-400/40 hover:from-emerald-400/10 hover:shadow-[0_8px_25px_-15px_rgba(16,185,129,0.4)]"
                                                    >
                                                        <div className="flex flex-col gap-4">
                                                            <div className="flex size-12 items-center justify-center rounded-xl border border-emerald-400/40 bg-gradient-to-br from-emerald-400/20 to-emerald-500/15 transition-all group-hover:from-emerald-400/30 group-hover:to-emerald-500/20">
                                                                <Smartphone className="h-6 w-6 text-emerald-300" />
                                                            </div>
                                                            <div>
                                                                <h3 className="mb-1 text-base font-semibold text-white">
                                                                    Push to Card
                                                                </h3>
                                                                <p className="text-xs leading-relaxed text-white/70">
                                                                    Instant
                                                                    transfer to
                                                                    your debit
                                                                    card. Get
                                                                    paid fast,
                                                                    usually
                                                                    within
                                                                    minutes.
                                                                </p>
                                                            </div>
                                                            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-emerald-300/80">
                                                                <span>
                                                                    Add Card
                                                                </span>
                                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                            </div>
                                                        </div>
                                                    </button>
                                                </div>

                                                <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
                                                    <p className="text-xs leading-relaxed text-amber-200/90">
                                                        <span className="font-semibold text-amber-200">
                                                            Note:
                                                        </span>{' '}
                                                        We just need your
                                                        primary payout method
                                                        for now. You can add
                                                        more payout methods
                                                        later and choose which
                                                        one to use for each
                                                        payment. All methods are
                                                        encrypted and secure.
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                                                {selectedPayoutMethod ===
                                                    'bank' && (
                                                    <BankAccount
                                                        onBack={() =>
                                                            setSelectedPayoutMethod(
                                                                null,
                                                            )
                                                        }
                                                        onSave={(data) => {
                                                            console.log(
                                                                'Bank account data:',
                                                                data,
                                                            );
                                                            // TODO: Save to backend
                                                            setSelectedPayoutMethod(
                                                                null,
                                                            );
                                                        }}
                                                    />
                                                )}
                                                {selectedPayoutMethod ===
                                                    'crypto' && (
                                                    <CryptoWallet
                                                        onBack={() =>
                                                            setSelectedPayoutMethod(
                                                                null,
                                                            )
                                                        }
                                                        onSave={(data) => {
                                                            console.log(
                                                                'Crypto wallet data:',
                                                                data,
                                                            );
                                                            // TODO: Save to backend
                                                            setSelectedPayoutMethod(
                                                                null,
                                                            );
                                                        }}
                                                    />
                                                )}
                                                {selectedPayoutMethod ===
                                                    'card' && (
                                                    <PushToCard
                                                        onBack={() =>
                                                            setSelectedPayoutMethod(
                                                                null,
                                                            )
                                                        }
                                                        onSave={(data) => {
                                                            console.log(
                                                                'Card data:',
                                                                data,
                                                            );
                                                            // TODO: Save to backend
                                                            setSelectedPayoutMethod(
                                                                null,
                                                            );
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeStep.component === 'subscription' && (
                                <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-6 text-center">
                                    <Sparkles className="mx-auto mb-4 h-12 w-12 text-amber-300" />
                                    <h3 className="mb-2 text-lg font-semibold text-amber-200">
                                        Subscription Rates Coming Soon
                                    </h3>
                                    <p className="text-sm text-amber-200/80">
                                        This feature is being built. You'll be
                                        able to set up your subscription pricing
                                        here soon.
                                    </p>
                                </div>
                            )}

                            {activeStep.component === 'wishlist' && (
                                <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-6 text-center">
                                    <Gift className="mx-auto mb-4 h-12 w-12 text-amber-300" />
                                    <h3 className="mb-2 text-lg font-semibold text-amber-200">
                                        Wishlist Items Coming Soon
                                    </h3>
                                    <p className="text-sm text-amber-200/80">
                                        This feature is being built. You'll be
                                        able to create wishlist items here soon.
                                    </p>
                                    {activeStep.status.current_count !==
                                        undefined && (
                                        <p className="mt-3 text-xs text-amber-200/70">
                                            Current progress:{' '}
                                            {activeStep.status.current_count} of{' '}
                                            {activeStep.status.required_count}{' '}
                                            items
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}

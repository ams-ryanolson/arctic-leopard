import {
    CCBillCardForm,
    type CardDetails,
} from '@/components/payments/CCBillCardForm';
import { Button } from '@/components/ui/button';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { useVaultPaymentMethod } from '@/hooks/use-vault-payment-method';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    CreditCard,
    Loader2,
    Plus,
    Shield,
    Star,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payment Methods',
        href: '/settings/payment-methods',
    },
];

type PaymentMethodsPageProps = {
    ccbill_client_accnum?: number;
    ccbill_client_subacc?: number;
    user?: {
        email?: string;
        name?: string;
        location_city?: string | null;
        location_region?: string | null;
        location_country?: string | null;
    };
};

function formatCardBrand(brand: string): string {
    const brandMap: Record<string, string> = {
        visa: 'Visa',
        mastercard: 'Mastercard',
        amex: 'American Express',
        discover: 'Discover',
        diners: 'Diners Club',
        jcb: 'JCB',
        unknown: 'Card',
    };
    return (
        brandMap[brand.toLowerCase()] ||
        brand.charAt(0).toUpperCase() + brand.slice(1)
    );
}

function formatExpiry(expMonth: string, expYear: string): string {
    const month = expMonth.padStart(2, '0');
    const year = expYear.slice(-2);
    return `${month}/${year}`;
}

function getCardIcon(brand: string): string {
    const icons: Record<string, string> = {
        visa: '💳',
        mastercard: '💳',
        amex: '💳',
        discover: '💳',
    };
    return icons[brand.toLowerCase()] || '💳';
}

function isCardExpiringSoon(expMonth: string, expYear: string): boolean {
    const now = new Date();
    const expDate = new Date(parseInt(expYear), parseInt(expMonth) - 1);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expDate <= threeMonthsFromNow && expDate >= now;
}

function isCardExpired(expMonth: string, expYear: string): boolean {
    const now = new Date();
    const expDate = new Date(parseInt(expYear), parseInt(expMonth));
    return expDate < now;
}

export default function PaymentMethods({
    ccbill_client_accnum = 0,
    ccbill_client_subacc = 0,
    user,
}: PaymentMethodsPageProps) {
    const {
        paymentMethods,
        loading,
        error,
        deleteMethod,
        setDefault,
        refresh,
    } = usePaymentMethods();
    const { vault } = useVaultPaymentMethod();
    const [showAddForm, setShowAddForm] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [settingDefaultId, setSettingDefaultId] = useState<number | null>(
        null,
    );

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this payment method?')) {
            return;
        }

        setDeletingId(id);
        try {
            await deleteMethod(id);
        } catch (err) {
            console.error('Failed to delete payment method:', err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleSetDefault = async (id: number) => {
        setSettingDefaultId(id);
        try {
            await setDefault(id);
        } catch (err) {
            console.error('Failed to set default payment method:', err);
        } finally {
            setSettingDefaultId(null);
        }
    };

    const handleTokenCreated = async (
        tokenId: string,
        is3DS: boolean,
        cardDetails: CardDetails,
    ) => {
        console.log('🎯 handleTokenCreated called with:', {
            tokenId,
            is3DS,
            cardDetails,
        });
        try {
            console.log('Vaulting payment method...');
            console.log(
                'About to call vault() - this should trigger a POST request',
            );
            const result = await vault({
                provider_token_id: tokenId,
                gateway: 'ccbill',
                is_default: paymentMethods.length === 0,
                card_last_four: cardDetails.lastFour,
                card_brand: cardDetails.brand,
                card_exp_month: cardDetails.expMonth,
                card_exp_year: cardDetails.expYear,
            });
            console.log('✅ Payment method vaulted successfully:', result);
            setShowAddForm(false);
            await refresh();
        } catch (err) {
            console.error('❌ Failed to vault payment method:', err);
            console.error('Error type:', err?.constructor?.name);
            console.error(
                'Error details:',
                JSON.stringify(
                    err,
                    Object.getOwnPropertyNames(err as object),
                    2,
                ),
            );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payment Methods" />
            <SettingsLayout>
                <div className="space-y-8">
                    {/* Saved Payment Methods Section */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(59,130,246,0.45)]">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-blue-500/15 via-blue-400/5 to-transparent blur-2xl" />
                        </div>
                        <div className="relative space-y-6 p-6 sm:p-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center rounded-xl border border-blue-400/40 bg-gradient-to-br from-blue-400/30 to-blue-500/20 p-3 shadow-[0_12px_30px_-18px_rgba(59,130,246,0.65)]">
                                        <CreditCard className="h-5 w-5 text-blue-300" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">
                                            Payment Methods
                                        </h2>
                                        <p className="text-sm text-white/65">
                                            Manage your saved cards for faster
                                            checkout
                                        </p>
                                    </div>
                                </div>
                                {!showAddForm && paymentMethods.length > 0 && (
                                    <Button
                                        onClick={() => setShowAddForm(true)}
                                        className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(59,130,246,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_16px_-4px_rgba(59,130,246,0.5)]"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Card
                                    </Button>
                                )}
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4">
                                    <AlertTriangle className="h-5 w-5 text-rose-400" />
                                    <p className="text-sm text-rose-300">
                                        {error}
                                    </p>
                                </div>
                            )}

                            {loading && (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                                </div>
                            )}

                            {!loading && !showAddForm && (
                                <>
                                    {paymentMethods.length === 0 ? (
                                        <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5">
                                            <div className="flex flex-col items-center gap-4 py-8 text-center">
                                                <div className="flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-4">
                                                    <CreditCard className="h-8 w-8 text-white/40" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-lg font-semibold text-white">
                                                        No Payment Methods
                                                    </h3>
                                                    <p className="max-w-sm text-sm text-white/60">
                                                        Add a payment method to
                                                        quickly purchase
                                                        memberships and make
                                                        tips.
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={() =>
                                                        setShowAddForm(true)
                                                    }
                                                    className="mt-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(59,130,246,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_16px_-4px_rgba(59,130,246,0.5)]"
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Add Payment Method
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {paymentMethods.map((method) => {
                                                const expiringSoon =
                                                    isCardExpiringSoon(
                                                        method.exp_month,
                                                        method.exp_year,
                                                    );
                                                const expired = isCardExpired(
                                                    method.exp_month,
                                                    method.exp_year,
                                                );

                                                return (
                                                    <div
                                                        key={method.id}
                                                        className={`rounded-2xl border p-4 transition hover:border-white/20 ${
                                                            method.is_default
                                                                ? 'border-blue-400/30 bg-blue-400/5'
                                                                : expired
                                                                  ? 'border-rose-400/30 bg-rose-400/5'
                                                                  : 'border-white/10 bg-black/20'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-4">
                                                                <div
                                                                    className={`flex items-center justify-center rounded-xl border p-3 ${
                                                                        method.is_default
                                                                            ? 'border-blue-400/40 bg-gradient-to-br from-blue-400/30 to-blue-500/20'
                                                                            : expired
                                                                              ? 'border-rose-400/40 bg-gradient-to-br from-rose-400/30 to-rose-500/20'
                                                                              : 'border-white/10 bg-white/5'
                                                                    }`}
                                                                >
                                                                    <CreditCard
                                                                        className={`h-5 w-5 ${
                                                                            method.is_default
                                                                                ? 'text-blue-300'
                                                                                : expired
                                                                                  ? 'text-rose-300'
                                                                                  : 'text-white/60'
                                                                        }`}
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium text-white">
                                                                            {formatCardBrand(
                                                                                method.brand,
                                                                            )}{' '}
                                                                            ••••{' '}
                                                                            {
                                                                                method.last_four
                                                                            }
                                                                        </span>
                                                                        {method.is_default && (
                                                                            <span className="flex items-center gap-1 rounded-full bg-blue-400/20 px-2 py-0.5 text-xs font-medium text-blue-300">
                                                                                <Star className="h-3 w-3" />
                                                                                Default
                                                                            </span>
                                                                        )}
                                                                        {expired && (
                                                                            <span className="flex items-center gap-1 rounded-full bg-rose-400/20 px-2 py-0.5 text-xs font-medium text-rose-300">
                                                                                Expired
                                                                            </span>
                                                                        )}
                                                                        {expiringSoon &&
                                                                            !expired && (
                                                                                <span className="flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-medium text-amber-300">
                                                                                    Expiring
                                                                                    Soon
                                                                                </span>
                                                                            )}
                                                                    </div>
                                                                    <div className="flex items-center gap-3 text-xs text-white/60">
                                                                        <span className="flex items-center gap-1">
                                                                            <Calendar className="h-3 w-3" />
                                                                            Expires{' '}
                                                                            {formatExpiry(
                                                                                method.exp_month,
                                                                                method.exp_year,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {!method.is_default && (
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() =>
                                                                            handleSetDefault(
                                                                                method.id,
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            settingDefaultId ===
                                                                            method.id
                                                                        }
                                                                        className="rounded-full border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:border-blue-500/40 hover:bg-blue-500/20"
                                                                    >
                                                                        {settingDefaultId ===
                                                                        method.id ? (
                                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                        ) : (
                                                                            'Set Default'
                                                                        )}
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            method.id,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        deletingId ===
                                                                        method.id
                                                                    }
                                                                    className="rounded-full border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:border-rose-500/40 hover:bg-rose-500/20 hover:text-rose-50"
                                                                >
                                                                    {deletingId ===
                                                                    method.id ? (
                                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                    ) : (
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Add Card Form */}
                            {showAddForm && (
                                <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Plus className="h-5 w-5 text-blue-400" />
                                            <h3 className="text-lg font-semibold text-white">
                                                Add New Card
                                            </h3>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                setShowAddForm(false)
                                            }
                                            className="rounded-full text-white/60 hover:bg-white/10 hover:text-white"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {ccbill_client_accnum &&
                                    ccbill_client_subacc ? (
                                        <CCBillCardForm
                                            clientAccnum={ccbill_client_accnum}
                                            clientSubacc={ccbill_client_subacc}
                                            onTokenCreated={handleTokenCreated}
                                            onCancel={() =>
                                                setShowAddForm(false)
                                            }
                                            gateway="ccbill"
                                            user={user}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
                                            <AlertTriangle className="h-5 w-5 text-amber-400" />
                                            <p className="text-sm text-amber-300">
                                                Payment configuration is
                                                missing. Please contact support.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Security Info Section */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(16,185,129,0.45)]">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-emerald-500/15 via-emerald-400/5 to-transparent blur-2xl" />
                        </div>
                        <div className="relative space-y-6 p-6 sm:p-8">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center rounded-xl border border-emerald-400/40 bg-gradient-to-br from-emerald-400/30 to-emerald-500/20 p-3 shadow-[0_12px_30px_-18px_rgba(16,185,129,0.65)]">
                                    <Shield className="h-5 w-5 text-emerald-300" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">
                                        Secure Payments
                                    </h2>
                                    <p className="text-sm text-white/65">
                                        Your payment information is protected
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                                        <div>
                                            <p className="font-medium text-white">
                                                PCI DSS Compliant
                                            </p>
                                            <p className="text-sm text-white/60">
                                                All payments processed through
                                                certified payment providers
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                                        <div>
                                            <p className="font-medium text-white">
                                                Encrypted Storage
                                            </p>
                                            <p className="text-sm text-white/60">
                                                Card details are tokenized and
                                                never stored on our servers
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                                        <div>
                                            <p className="font-medium text-white">
                                                3D Secure
                                            </p>
                                            <p className="text-sm text-white/60">
                                                Additional authentication for
                                                enhanced fraud protection
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                                        <div>
                                            <p className="font-medium text-white">
                                                Discreet Billing
                                            </p>
                                            <p className="text-sm text-white/60">
                                                Charges appear discretely on
                                                your statement
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

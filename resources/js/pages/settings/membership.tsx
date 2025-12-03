import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    Crown,
    Gift,
    History,
    Receipt,
    Sparkles,
    XCircle,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Membership',
        href: '/settings/membership',
    },
];

type Plan = {
    id: number;
    name: string;
    slug: string;
    description?: string;
};

type Payment = {
    id: number;
    uuid: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string | null;
};

type Membership = {
    id: number;
    uuid: string;
    plan: Plan;
    status: string;
    billing_type: 'recurring' | 'one_time';
    starts_at: string | null;
    ends_at: string | null;
    next_billing_at: string | null;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    original_price: number;
    discount_amount: number;
    is_active: boolean;
    is_expired?: boolean;
    days_remaining: number;
    payment?: Payment | null;
    created_at: string | null;
};

type GiftRecipient = {
    id: number;
    username: string;
    display_name: string;
};

type PaymentHistoryItem = {
    id: number;
    uuid: string;
    amount: number;
    currency: string;
    status: string;
    plan_name: string;
    billing_type: string | null;
    billing_interval: string | null;
    is_gift?: boolean;
    gift_recipient?: GiftRecipient | null;
    gift_message?: string | null;
    created_at: string | null;
};

type Props = {
    activeMembership: Membership | null;
    membershipHistory: Membership[];
    paymentHistory: PaymentHistoryItem[];
};

export default function MembershipSettings({
    activeMembership,
    membershipHistory,
    paymentHistory,
}: Props) {
    const formatDate = (dateString: string | null): string => {
        if (!dateString) return 'Unknown';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatPrice = (cents: number, currency: string = 'USD'): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(cents / 100);
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'active':
                return 'text-emerald-400';
            case 'cancelled':
                return 'text-amber-400';
            case 'expired':
                return 'text-rose-400';
            case 'captured':
            case 'succeeded':
                return 'text-emerald-400';
            case 'failed':
                return 'text-rose-400';
            case 'pending':
                return 'text-amber-400';
            default:
                return 'text-white/60';
        }
    };

    const getStatusLabel = (status: string): string => {
        switch (status) {
            case 'active':
                return 'Active';
            case 'cancelled':
                return 'Cancelled';
            case 'expired':
                return 'Expired';
            case 'captured':
            case 'succeeded':
                return 'Paid';
            case 'failed':
                return 'Failed';
            case 'pending':
                return 'Pending';
            default:
                return status;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Membership" />

            <SettingsLayout>
                <div className="space-y-8">
                    {/* Current Membership Section */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(16,185,129,0.45)]">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-emerald-500/15 via-emerald-400/5 to-transparent blur-2xl" />
                        </div>
                        <div className="relative space-y-6 p-6 sm:p-8">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center rounded-xl border border-emerald-400/40 bg-gradient-to-br from-emerald-400/30 to-emerald-500/20 p-3 shadow-[0_12px_30px_-18px_rgba(16,185,129,0.65)]">
                                    <Crown className="h-5 w-5 text-emerald-300" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">
                                        Current Membership
                                    </h2>
                                    <p className="text-sm text-white/65">
                                        Your active membership status
                                    </p>
                                </div>
                            </div>

                            {activeMembership ? (
                                <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="h-5 w-5 text-emerald-400" />
                                                <h3 className="text-lg font-semibold text-white">
                                                    {activeMembership.plan.name}
                                                </h3>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(activeMembership.status)}`}
                                                >
                                                    {getStatusLabel(
                                                        activeMembership.status,
                                                    )}
                                                </span>
                                            </div>
                                            {activeMembership.plan
                                                .description && (
                                                <p className="text-sm text-white/60">
                                                    {
                                                        activeMembership.plan
                                                            .description
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="rounded-full border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:border-amber-500/40 hover:bg-amber-500/20"
                                        >
                                            <Link href="/upgrade">
                                                Upgrade
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                                            <Calendar className="h-4 w-4 text-white/60" />
                                            <div>
                                                <p className="text-xs text-white/50">
                                                    Started
                                                </p>
                                                <p className="text-sm font-medium text-white">
                                                    {formatDate(
                                                        activeMembership.starts_at,
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {activeMembership.ends_at && (
                                            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                                                <Clock className="h-4 w-4 text-white/60" />
                                                <div>
                                                    <p className="text-xs text-white/50">
                                                        {activeMembership.billing_type ===
                                                        'recurring'
                                                            ? 'Renews'
                                                            : 'Expires'}
                                                    </p>
                                                    <p className="text-sm font-medium text-white">
                                                        {formatDate(
                                                            activeMembership.ends_at,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                                            <CreditCard className="h-4 w-4 text-white/60" />
                                            <div>
                                                <p className="text-xs text-white/50">
                                                    Billing Type
                                                </p>
                                                <p className="text-sm font-medium text-white capitalize">
                                                    {activeMembership.billing_type.replace(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {activeMembership.days_remaining > 0 &&
                                        activeMembership.days_remaining <=
                                            30 && (
                                            <div className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
                                                <Clock className="h-4 w-4 text-amber-400" />
                                                <p className="text-sm text-amber-300">
                                                    {
                                                        activeMembership.days_remaining
                                                    }{' '}
                                                    days remaining
                                                    {activeMembership.billing_type ===
                                                        'one_time' &&
                                                        ' — Consider renewing to keep your benefits'}
                                                </p>
                                            </div>
                                        )}
                                </div>
                            ) : (
                                <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-5">
                                    <div className="flex flex-col items-center gap-4 py-8 text-center">
                                        <div className="flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-4">
                                            <Crown className="h-8 w-8 text-white/40" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-semibold text-white">
                                                No Active Membership
                                            </h3>
                                            <p className="max-w-sm text-sm text-white/60">
                                                Upgrade to a membership plan to
                                                unlock premium features and
                                                support the community.
                                            </p>
                                        </div>
                                        <Button
                                            asChild
                                            className="mt-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(249,115,22,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_16px_-4px_rgba(249,115,22,0.5)]"
                                        >
                                            <Link href="/upgrade">
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                View Plans
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Membership History Section */}
                    {membershipHistory.length > 0 && (
                        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(59,130,246,0.45)]">
                            <div className="pointer-events-none absolute inset-0">
                                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-blue-500/15 via-blue-400/5 to-transparent blur-2xl" />
                            </div>
                            <div className="relative space-y-6 p-6 sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center rounded-xl border border-blue-400/40 bg-gradient-to-br from-blue-400/30 to-blue-500/20 p-3 shadow-[0_12px_30px_-18px_rgba(59,130,246,0.65)]">
                                        <History className="h-5 w-5 text-blue-300" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">
                                            Membership History
                                        </h2>
                                        <p className="text-sm text-white/65">
                                            Your past and current memberships
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {membershipHistory.map((membership) => (
                                        <div
                                            key={membership.id}
                                            className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-black/30"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        {membership.is_active ? (
                                                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                                        ) : membership.status ===
                                                          'cancelled' ? (
                                                            <XCircle className="h-4 w-4 text-amber-400" />
                                                        ) : (
                                                            <Clock className="h-4 w-4 text-white/40" />
                                                        )}
                                                        <span className="text-sm font-medium text-white">
                                                            {
                                                                membership.plan
                                                                    .name
                                                            }
                                                        </span>
                                                        <span
                                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(membership.status)}`}
                                                        >
                                                            {getStatusLabel(
                                                                membership.status,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
                                                        <span>
                                                            {formatDate(
                                                                membership.starts_at,
                                                            )}{' '}
                                                            -{' '}
                                                            {membership.ends_at
                                                                ? formatDate(
                                                                      membership.ends_at,
                                                                  )
                                                                : 'Ongoing'}
                                                        </span>
                                                        <span className="capitalize">
                                                            {membership.billing_type.replace(
                                                                '_',
                                                                ' ',
                                                            )}
                                                        </span>
                                                        <span>
                                                            {formatPrice(
                                                                membership.original_price,
                                                            )}
                                                            {membership.discount_amount >
                                                                0 && (
                                                                <span className="ml-1 text-emerald-400">
                                                                    (-
                                                                    {formatPrice(
                                                                        membership.discount_amount,
                                                                    )}
                                                                    )
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    {membership.cancellation_reason && (
                                                        <p className="text-xs text-amber-400/80">
                                                            Reason:{' '}
                                                            {membership.cancellation_reason.replace(
                                                                /_/g,
                                                                ' ',
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment History Section */}
                    {paymentHistory.length > 0 && (
                        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(124,58,237,0.45)]">
                            <div className="pointer-events-none absolute inset-0">
                                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-violet-500/15 via-violet-400/5 to-transparent blur-2xl" />
                            </div>
                            <div className="relative space-y-6 p-6 sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center rounded-xl border border-violet-400/40 bg-gradient-to-br from-violet-400/30 to-violet-500/20 p-3 shadow-[0_12px_30px_-18px_rgba(124,58,237,0.65)]">
                                        <Receipt className="h-5 w-5 text-violet-300" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">
                                            Payment History
                                        </h2>
                                        <p className="text-sm text-white/65">
                                            Your membership payment transactions
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {paymentHistory.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-black/30"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {payment.status ===
                                                            'captured' ||
                                                        payment.status ===
                                                            'succeeded' ? (
                                                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                                        ) : payment.status ===
                                                          'failed' ? (
                                                            <XCircle className="h-4 w-4 text-rose-400" />
                                                        ) : (
                                                            <Clock className="h-4 w-4 text-amber-400" />
                                                        )}
                                                        <span className="text-sm font-medium text-white">
                                                            {payment.plan_name}
                                                        </span>
                                                        {payment.is_gift && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/20 px-2 py-0.5 text-xs font-medium text-pink-300">
                                                                <Gift className="h-3 w-3" />
                                                                Gift
                                                            </span>
                                                        )}
                                                        <span
                                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(payment.status)}`}
                                                        >
                                                            {getStatusLabel(
                                                                payment.status,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
                                                        <span>
                                                            {formatDate(
                                                                payment.created_at,
                                                            )}
                                                        </span>
                                                        {payment.billing_interval && (
                                                            <span className="capitalize">
                                                                {
                                                                    payment.billing_interval
                                                                }
                                                            </span>
                                                        )}
                                                        {payment.is_gift &&
                                                            payment.gift_recipient && (
                                                                <span className="text-pink-300/80">
                                                                    For{' '}
                                                                    <Link
                                                                        href={`/@${payment.gift_recipient.username}`}
                                                                        className="font-medium hover:text-pink-200 hover:underline"
                                                                    >
                                                                        {payment
                                                                            .gift_recipient
                                                                            .display_name ||
                                                                            payment
                                                                                .gift_recipient
                                                                                .username}
                                                                    </Link>
                                                                </span>
                                                            )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-white">
                                                        {formatPrice(
                                                            payment.amount,
                                                            payment.currency,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

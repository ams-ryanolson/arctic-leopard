import {
    DataTable,
    type DataTableColumn,
} from '@/components/signals/data-table';
import {
    StatusBadge,
    type StatusTone,
} from '@/components/signals/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import {
    type HeaderAction,
    type HeaderFilter,
    type HeaderQuickAction,
} from '@/types';
import { Head } from '@inertiajs/react';
import {
    Banknote,
    CheckCircle2,
    ClipboardCheck,
    FileWarning,
    ShieldCheck,
} from 'lucide-react';

type PayoutAccount = {
    id: string;
    label: string;
    type: string;
    currency: string;
    status: 'verified' | 'pending_verification' | 'needs_documents';
    default: boolean;
    limits: string;
};

type ScheduleConfig = {
    frequency: string;
    nextPayout: string;
    options: Array<{ label: string; value: string }>;
};

type ManualWindow = {
    eligible: boolean;
    lastManualPayout: string;
    cooldownHours: number;
};

type ScheduleItem = {
    id: string;
    label: string;
    amount: number;
    scheduledFor: string;
    status: 'scheduled' | 'requires-action';
};

type LedgerEntry = {
    id: string;
    date: string;
    description: string;
    type: 'credit' | 'debit';
    amount: number;
    balance: number;
};

type ChecklistItem = {
    id: string;
    item: string;
    status: 'pending' | 'in-progress' | 'complete';
    owner: string;
    dueDate: string;
};

type AccountStatus = {
    health: 'attention' | 'healthy';
    messages: string[];
    limits: {
        daily: { limit: number; used: number };
        monthly: { limit: number; used: number };
    };
};

interface PayoutsPageProps {
    accounts: PayoutAccount[];
    scheduleConfig: ScheduleConfig;
    manualWindow: ManualWindow;
    schedule: ScheduleItem[];
    ledger: LedgerEntry[];
    complianceChecklist: ChecklistItem[];
    accountStatus: AccountStatus;
}

function formatCurrency(value: number): string {
    return Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(value);
}

const checklistStatusStyles: Record<ChecklistItem['status'], string> = {
    pending: 'border-rose-400/40 bg-rose-400/10 text-rose-100',
    'in-progress': 'border-amber-400/40 bg-amber-400/10 text-amber-100',
    complete: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100',
};

const payoutAccountStatusTone: Record<PayoutAccount['status'], StatusTone> = {
    verified: 'emerald',
    pending_verification: 'amber',
    needs_documents: 'rose',
};

export default function PayoutsPage({
    accounts,
    scheduleConfig,
    manualWindow,
    schedule,
    ledger,
    complianceChecklist,
    accountStatus,
}: PayoutsPageProps) {
    const ledgerColumns: DataTableColumn<LedgerEntry>[] = [
        {
            key: 'date',
            header: 'Date',
            render: (entry) =>
                new Date(entry.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                }),
        },
        {
            key: 'description',
            header: 'Description',
        },
        {
            key: 'amount',
            header: 'Amount',
            align: 'right',
            render: (entry) => (
                <span
                    className={cn(
                        'font-semibold',
                        entry.type === 'credit'
                            ? 'text-emerald-200'
                            : 'text-rose-200',
                    )}
                >
                    {entry.type === 'credit' ? '+' : '-'}
                    {formatCurrency(entry.amount)}
                </span>
            ),
        },
        {
            key: 'balance',
            header: 'Balance',
            align: 'right',
            render: (entry) => (
                <span className="text-white/60">
                    {formatCurrency(entry.balance)}
                </span>
            ),
        },
    ];

    const headerActions: HeaderAction[] = [
        {
            id: 'initiate-transfer',
            label: 'Initiate transfer',
            icon: Banknote,
            href: '/signals/payouts',
            variant: 'primary',
        },
        {
            id: 'lock-treasury',
            label: 'Lock treasury',
            icon: ShieldCheck,
            href: '/signals/compliance',
            variant: 'secondary',
        },
    ];

    const headerFilters: HeaderFilter[] = [
        {
            id: 'view',
            label: 'View',
            value: 'Treasury',
            options: [
                { label: 'Treasury', value: 'treasury' },
                { label: 'Creator splits', value: 'creators' },
                { label: 'Vendors', value: 'vendors' },
            ],
        },
    ];

    const headerQuickActions: HeaderQuickAction[] = [
        {
            id: 'verify-backup-account',
            title: 'Verify backup account',
            description: 'Upload verification doc to unlock secondary routing.',
            icon: FileWarning,
            badge: 'Attention',
            href: '/signals/payouts',
        },
        {
            id: 'refresh-tax-docs',
            title: 'Refresh W-9 queue',
            description:
                'Send reminders to creators missing current fiscal docs.',
            icon: ClipboardCheck,
            badge: 'Compliance',
            href: '/signals/compliance',
        },
    ];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Signals', href: '/signals' },
                { title: 'Payouts', href: '/signals/payouts' },
            ]}
            headerActions={headerActions}
            headerFilters={headerFilters}
            headerQuickActions={headerQuickActions}
        >
            <Head title="Signals · Payouts" />

            <div className="space-y-8 text-white">
                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader className="flex items-start justify-between gap-4">
                            <div>
                                <CardTitle className="text-2xl font-semibold">
                                    Payout accounts
                                </CardTitle>
                                <CardDescription className="text-white/60">
                                    Choose default endpoints and verify
                                    alternate routes before each cycle.
                                </CardDescription>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full border-white/20 text-white/80 hover:border-white/40"
                            >
                                Add account
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {accounts.map((account) => (
                                <div
                                    key={account.id}
                                    className="rounded-2xl border border-white/10 bg-black/25 p-4"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">
                                                {account.label}
                                            </p>
                                            <p className="text-xs text-white/60">
                                                {account.type} •{' '}
                                                {account.currency} •{' '}
                                                {account.limits}
                                            </p>
                                        </div>
                                        <StatusBadge
                                            tone={
                                                payoutAccountStatusTone[
                                                    account.status
                                                ]
                                            }
                                        >
                                            {account.status ===
                                            'pending_verification'
                                                ? 'Pending verification'
                                                : account.status ===
                                                    'needs_documents'
                                                  ? 'Needs documents'
                                                  : 'Verified'}
                                        </StatusBadge>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                                        <span>
                                            {account.default
                                                ? 'Default payout destination'
                                                : 'Available as secondary route'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {!account.default ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-white/20 text-white/70"
                                                >
                                                    Set default
                                                </Button>
                                            ) : (
                                                <StatusBadge tone="emerald">
                                                    Default
                                                </StatusBadge>
                                            )}
                                            {account.status !== 'verified' ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-white/60 hover:text-amber-200"
                                                >
                                                    Resolve
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">
                                Schedule & manual triggers
                            </CardTitle>
                            <CardDescription className="text-white/60">
                                Configure cadence, then initiate manual payouts
                                when cash flow surges.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="space-y-3">
                                <p className="text-xs tracking-[0.3em] text-white/50 uppercase">
                                    Cadence
                                </p>
                                <div className="space-y-2">
                                    {scheduleConfig.options.map((option) => (
                                        <label
                                            key={option.value}
                                            className={cn(
                                                'flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2 transition hover:border-emerald-400/40 hover:bg-white/10',
                                                scheduleConfig.frequency ===
                                                    option.value &&
                                                    'border-emerald-400/60 bg-emerald-400/10',
                                            )}
                                        >
                                            <span className="text-sm text-white">
                                                {option.label}
                                            </span>
                                            <input
                                                type="radio"
                                                name="payout-frequency"
                                                checked={
                                                    scheduleConfig.frequency ===
                                                    option.value
                                                }
                                                readOnly
                                                className="size-4 accent-emerald-400"
                                            />
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-white/60">
                                    Next automatic payout:{' '}
                                    <span className="font-semibold text-white">
                                        {new Date(
                                            scheduleConfig.nextPayout,
                                        ).toLocaleString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full border-white/20 text-white/80 hover:border-white/40 hover:text-white"
                                >
                                    Save schedule (mock)
                                </Button>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            Manual payout window
                                        </p>
                                        <p className="text-xs text-white/60">
                                            Last manual payout{' '}
                                            {new Date(
                                                manualWindow.lastManualPayout,
                                            ).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                            })}{' '}
                                            • Cooldown{' '}
                                            {manualWindow.cooldownHours}h
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-300 text-black disabled:opacity-60"
                                        disabled={!manualWindow.eligible}
                                    >
                                        Initiate now
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-2xl font-semibold">
                                Upcoming transfers
                            </CardTitle>
                            <CardDescription className="text-white/60">
                                Review disbursements, confirm splits, and clear
                                blockers before the window closes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {schedule.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-5 shadow-[0_18px_60px_-48px_rgba(125,211,252,0.55)] md:flex-row md:items-center md:justify-between"
                                >
                                    <div>
                                        <p className="text-xs tracking-[0.35em] text-white/50 uppercase">
                                            {new Date(
                                                item.scheduledFor,
                                            ).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </p>
                                        <h3 className="mt-2 text-lg font-semibold text-white">
                                            {item.label}
                                        </h3>
                                        <p className="text-sm text-white/70">
                                            {index === 0
                                                ? 'Primary weekly disbursement'
                                                : 'Batch payout'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xl font-semibold text-white">
                                            {formatCurrency(item.amount)}
                                        </span>
                                        <StatusBadge
                                            tone={
                                                item.status ===
                                                'requires-action'
                                                    ? 'rose'
                                                    : 'emerald'
                                            }
                                        >
                                            {item.status === 'requires-action'
                                                ? 'Action needed'
                                                : 'Scheduled'}
                                        </StatusBadge>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">
                                Account limits
                            </CardTitle>
                            <CardDescription className="text-white/60">
                                Rolling snapshots against treasury guardrails.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {(['daily', 'monthly'] as const).map((window) => (
                                <div
                                    key={window}
                                    className="rounded-2xl border border-white/10 bg-black/25 p-4"
                                >
                                    <div className="flex items-center justify-between text-sm">
                                        <p className="tracking-[0.3em] text-white/50 uppercase">
                                            {window}
                                        </p>
                                        <span className="font-semibold text-white/90">
                                            {formatCurrency(
                                                accountStatus.limits[window]
                                                    .used,
                                            )}{' '}
                                            <span className="text-white/50">
                                                /{' '}
                                                {formatCurrency(
                                                    accountStatus.limits[window]
                                                        .limit,
                                                )}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                                        <div
                                            className={cn(
                                                'h-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-300',
                                            )}
                                            style={{
                                                width: `${Math.min((accountStatus.limits[window].used / accountStatus.limits[window].limit) * 100, 100)}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                                <p className="text-xs tracking-[0.3em] text-white/50 uppercase">
                                    Health
                                </p>
                                <h3 className="mt-2 text-lg font-semibold">
                                    {accountStatus.health === 'attention'
                                        ? 'Needs attention'
                                        : 'All clear'}
                                </h3>
                                <ul className="mt-3 space-y-2 text-sm text-white/70">
                                    {accountStatus.messages.map((message) => (
                                        <li
                                            key={message}
                                            className="flex items-start gap-2"
                                        >
                                            <CheckCircle2 className="mt-0.5 size-4 text-emerald-300" />
                                            <span>{message}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">
                                Ledger
                            </CardTitle>
                            <CardDescription className="text-white/60">
                                Most recent treasury entries with running
                                balance.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={ledgerColumns} data={ledger} />
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">
                                Compliance checklist
                            </CardTitle>
                            <CardDescription className="text-white/60">
                                Required guardrails to release scheduled
                                payouts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {complianceChecklist.map((task) => (
                                <div
                                    key={task.id}
                                    className={cn(
                                        'rounded-2xl border px-4 py-4 text-sm transition hover:border-amber-400/40 hover:bg-white/10',
                                        checklistStatusStyles[task.status],
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-white">
                                            {task.item}
                                        </p>
                                        <Badge className="rounded-full border-white/15 bg-white/10 text-[0.65rem] tracking-[0.3em] text-white/70 uppercase">
                                            {task.owner}
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-xs text-white/70">
                                        Due{' '}
                                        {new Date(
                                            task.dueDate,
                                        ).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}

import { ActionBanner } from '@/components/signals/action-banner';
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
    ClipboardList,
    FileWarning,
    ShieldAlert,
    ShieldCheck,
} from 'lucide-react';

type Dispute = {
    id: string;
    customer: string;
    cardBrand: string;
    amount: number;
    reason: string;
    status: 'respond-by' | 'in-review' | 'won';
    deadline: string;
    lastAction: string;
};

type ComplianceMetrics = {
    winRate: string;
    openDisputes: number;
    pendingDocs: number;
};

type KycTask = {
    id: string;
    entity: string;
    task: string;
    status: 'pending' | 'in-review' | 'complete';
    dueDate: string;
};

type DocumentItem = {
    id: string;
    name: string;
    status: 'Received' | 'Pending review' | 'Required';
    receivedAt: string | null;
};

type Guide = {
    id: string;
    title: string;
    summary: string;
    action: string;
};

interface CompliancePageProps {
    disputes: Dispute[];
    metrics: ComplianceMetrics;
    kycTasks: KycTask[];
    documents: DocumentItem[];
    guides: Guide[];
}

const disputeStatusStyles: Record<Dispute['status'], string> = {
    'respond-by': 'border-rose-400/40 bg-rose-400/10 text-rose-100',
    'in-review': 'border-amber-400/40 bg-amber-400/10 text-amber-100',
    won: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100',
};

const kycStatusStyles: Record<KycTask['status'], string> = {
    pending: 'border-rose-400/40 bg-rose-400/10 text-rose-100',
    'in-review': 'border-amber-400/40 bg-amber-400/10 text-amber-100',
    complete: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100',
};

export default function CompliancePage({
    disputes,
    metrics,
    kycTasks,
    documents,
    guides,
}: CompliancePageProps) {
    const headerActions: HeaderAction[] = [
        {
            id: 'open-disputes',
            label: 'Resolve dispute',
            icon: ShieldAlert,
            href: '/signals/compliance',
            variant: 'primary',
        },
        {
            id: 'review-kyc',
            label: 'Review KYC',
            icon: ShieldCheck,
            href: '/signals/settings',
            variant: 'secondary',
        },
    ];

    const headerFilters: HeaderFilter[] = [
        {
            id: 'view',
            label: 'View',
            value: 'Chargebacks',
            options: [
                { label: 'Chargebacks', value: 'chargebacks' },
                { label: 'KYC', value: 'kyc' },
                { label: 'Policy', value: 'policy' },
            ],
        },
    ];

    const headerQuickActions: HeaderQuickAction[] = [
        {
            id: 'download-evidence',
            title: 'Download evidence kit',
            description:
                'Pre-fill dispute templates with customer receipts and consent logs.',
            icon: FileWarning,
            badge: 'Urgent',
            href: '/signals/overview',
        },
        {
            id: 'schedule-audit',
            title: 'Schedule compliance audit',
            description:
                'Run quarterly review of content policies and payout limits.',
            icon: ClipboardList,
            badge: 'Plan',
            href: '/signals/settings',
        },
    ];

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Home', href: '/dashboard' },
                { title: 'Signals', href: '/signals' },
                { title: 'Compliance', href: '/signals/compliance' },
            ]}
            headerActions={headerActions}
            headerFilters={headerFilters}
            headerQuickActions={headerQuickActions}
        >
            <Head title="Signals · Compliance" />

            <div className="space-y-8 text-white">
                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-2xl font-semibold">
                                Chargeback queue
                            </CardTitle>
                            <CardDescription className="text-white/60">
                                Prioritize deadlines, upload evidence, and track
                                win rates per processor.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {disputes.map((dispute) => (
                                <div
                                    key={dispute.id}
                                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-white">
                                            {dispute.customer} ·{' '}
                                            {dispute.cardBrand}
                                        </p>
                                        <span
                                            className={cn(
                                                'rounded-full border px-3 py-1 text-xs tracking-[0.3em] uppercase',
                                                disputeStatusStyles[
                                                    dispute.status
                                                ],
                                            )}
                                        >
                                            {dispute.status === 'respond-by'
                                                ? 'Respond by'
                                                : dispute.status === 'in-review'
                                                  ? 'In review'
                                                  : 'Won'}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-sm text-white/70">
                                        <span>{dispute.reason}</span>
                                        <span className="font-semibold text-white">
                                            {formatCurrency(dispute.amount)}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-xs text-white/60">
                                        Deadline{' '}
                                        <span className="font-semibold text-white">
                                            {new Date(
                                                dispute.deadline,
                                            ).toLocaleString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>{' '}
                                        • Last action{' '}
                                        {new Date(
                                            dispute.lastAction,
                                        ).toLocaleString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </div>
                                    <div className="mt-3 flex items-center justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-white/20 text-white/70"
                                        >
                                            View evidence
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 text-black"
                                        >
                                            Submit response
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">
                                Key metrics
                            </CardTitle>
                            <CardDescription className="text-white/60">
                                Win rate and document readiness for the current
                                settlement window.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                                <p className="text-xs tracking-[0.3em] text-white/50 uppercase">
                                    Win rate
                                </p>
                                <p className="mt-2 text-3xl font-semibold text-white">
                                    {metrics.winRate}
                                </p>
                                <p className="text-xs text-white/60">
                                    Rolling 90-day dispute performance
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                                <p className="text-xs tracking-[0.3em] text-white/50 uppercase">
                                    Open disputes
                                </p>
                                <p className="mt-2 text-3xl font-semibold text-white">
                                    {metrics.openDisputes}
                                </p>
                                <p className="text-xs text-white/60">
                                    Needing response this week
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                                <p className="text-xs tracking-[0.3em] text-white/50 uppercase">
                                    Pending documents
                                </p>
                                <p className="mt-2 text-3xl font-semibold text-white">
                                    {metrics.pendingDocs}
                                </p>
                                <p className="text-xs text-white/60">
                                    Awaiting uploads or verification
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">
                                KYC tasks
                            </CardTitle>
                            <CardDescription className="text-white/60">
                                Stay ahead of renewals, beneficial owner
                                changes, and policy acknowledgements.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {kycTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className={cn(
                                        'rounded-2xl border px-4 py-4 text-sm transition hover:border-emerald-400/40 hover:bg-white/10',
                                        kycStatusStyles[task.status],
                                    )}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <p className="font-semibold text-white">
                                            {task.entity}
                                        </p>
                                        <Badge className="rounded-full border-white/15 bg-white/10 text-[0.65rem] tracking-[0.3em] text-white/70 uppercase">
                                            {task.status}
                                        </Badge>
                                    </div>
                                    <p className="mt-2 text-sm text-white/80">
                                        {task.task}
                                    </p>
                                    <p className="mt-2 text-xs text-white/60">
                                        Due{' '}
                                        {new Date(
                                            task.dueDate,
                                        ).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </p>
                                    <div className="mt-3 flex items-center justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-white/20 text-white/70"
                                        >
                                            Review
                                        </Button>
                                        {task.status !== 'complete' ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-white/60 hover:text-emerald-200"
                                            >
                                                Mark complete
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">
                                Document center
                            </CardTitle>
                            <CardDescription className="text-white/60">
                                Track required tax forms and identity documents
                                for every payout route.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {documents.map((document) => (
                                <div
                                    key={document.id}
                                    className="rounded-2xl border border-white/10 bg-black/25 p-4"
                                >
                                    <div className="flex items-center justify-between text-sm">
                                        <p className="font-medium text-white">
                                            {document.name}
                                        </p>
                                        <Badge className="rounded-full border-white/15 bg-white/10 text-[0.65rem] tracking-[0.3em] text-white/70 uppercase">
                                            {document.status}
                                        </Badge>
                                    </div>
                                    <p className="mt-2 text-xs text-white/60">
                                        {document.receivedAt
                                            ? `Received ${new Date(
                                                  document.receivedAt,
                                              ).toLocaleDateString(undefined, {
                                                  month: 'short',
                                                  day: 'numeric',
                                              })}`
                                            : 'Awaiting upload'}
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-3 rounded-full border-white/20 text-white/70 hover:border-white/40 hover:text-white"
                                    >
                                        {document.status === 'Required'
                                            ? 'Upload now'
                                            : 'View'}
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                    {guides.map((guide) => (
                        <ActionBanner
                            key={guide.id}
                            title={guide.title}
                            description={guide.summary}
                            icon={
                                guide.title.includes('Chargeback')
                                    ? ShieldAlert
                                    : ShieldCheck
                            }
                            tone={
                                guide.title.includes('Chargeback')
                                    ? 'rose'
                                    : 'emerald'
                            }
                            href="/signals/overview"
                            actionLabel={guide.action}
                        />
                    ))}
                </section>
            </div>
        </AppLayout>
    );
}

function formatCurrency(value: number): string {
    return Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(value);
}

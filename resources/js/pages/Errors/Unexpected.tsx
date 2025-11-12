import { Head, Link, usePage } from '@inertiajs/react';
import type { AppProps } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Check,
    Clipboard,
    Mail,
    RefreshCw,
    Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { BoundaryContext } from '@/components/errors/AppErrorBoundary';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { dashboard, login, register } from '@/routes';
import onboardingRoutes from '@/routes/onboarding';
import { type SharedData } from '@/types';

type QuickLink = {
    title: string;
    description: string;
    href: string;
};

type TemplateProps = {
    status: number;
    titleLine: string;
    summaryTitle: string;
    summaryMessage: string;
    reference: string;
    timestampLabel: string;
    copyPayload: string;
    primaryHref: string;
    primaryLabel: string;
    secondaryHref: string;
    secondaryLabel: string;
    supportHref: string;
    quickLinks: QuickLink[];
    onTryAgain?: () => void;
    includeHead?: boolean;
    detailHeading: string;
    detailHint?: string;
    copyLabel: string;
    copySuccessLabel?: string;
};

const supportEmail = 'support@realkinkmen.com';

type UserSummary = {
    id: number;
    email?: string | null;
    username?: string | null;
};

const memberQuickLinks: QuickLink[] = [
    {
        title: 'Return to dashboard',
        description: 'Jump back into your feed and keep your momentum.',
        href: dashboard(),
    },
    {
        title: 'Onboarding',
        description: 'Revisit your profile setup and preferences.',
        href: onboardingRoutes.start.url(),
    },
    {
        title: 'Signals',
        description: 'Check what the community is tuning into right now.',
        href: '/signals',
    },
];

const guestQuickLinks: QuickLink[] = [
    {
        title: 'Welcome tour',
        description: 'Go back to the welcome experience and explore the vibe.',
        href: '/',
    },
    {
        title: 'Join the network',
        description: 'Create your account to unlock curated experiences.',
        href: register(),
    },
    {
        title: 'Signals preview',
        description: 'See what the community’s amplifying right now.',
        href: '/signals',
    },
];

function createReference(status: number): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return `RK-${status}-${crypto.randomUUID()}`;
    }

    return `RK-${status}-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
}

function buildSupportHref(copyPayload: string, locationHref: string): string {
    const subject = encodeURIComponent('Real Kink Men · Unexpected error');
    const body = encodeURIComponent(
        `Hi support,\n\nI ran into an unexpected error while using the app.\n\nCurrent page: ${locationHref}\n\nReference details:\n${copyPayload}\n\nThanks for the help!`,
    );

    return `mailto:${supportEmail}?subject=${subject}&body=${body}`;
}

function getUserSummary(shared: Partial<SharedData>): UserSummary | undefined {
    const user = shared?.auth?.user;

    if (!user) {
        return undefined;
    }

    const summary: UserSummary = { id: user.id };

    if (user.email) {
        summary.email = user.email;
    }

    if (user.username) {
        summary.username = user.username;
    }

    return summary;
}

type ServerPayloadOptions = {
    status: number;
    exceptionMessage?: string | null;
    exceptionClass?: string | null;
    reportId?: string | null;
    locationHref: string;
    component: string;
    props: Record<string, unknown>;
    version?: string;
    userSummary?: UserSummary;
    debugEnabled: boolean;
    capturedAt: string;
};

function buildServerPayload({
    status,
    exceptionMessage,
    exceptionClass,
    reportId,
    locationHref,
    component,
    props,
    version,
    userSummary,
    debugEnabled,
    capturedAt,
}: ServerPayloadOptions): { reference: string; payload: string } {
    const reference = reportId ?? createReference(status);

    const base: Record<string, unknown> = {
        reference,
        status,
        url: locationHref,
        capturedAt,
    };

    if (reportId) {
        base.reportId = reportId;
    }

    if (debugEnabled) {
        base.message = exceptionMessage;
        base.exceptionClass = exceptionClass;
        base.component = component;
        base.props = props;
        base.version = version;

        if (userSummary) {
            base.user = userSummary;
        }
    }

    return {
        reference,
        payload: JSON.stringify(base, null, 2),
    };
}

type ClientPayloadOptions = {
    status: number;
    context: BoundaryContext;
    initialPage: AppProps['initialPage'];
    locationHref: string;
    debugEnabled: boolean;
};

function buildClientPayload({
    status,
    context,
    initialPage,
    locationHref,
    debugEnabled,
}: ClientPayloadOptions): { reference: string; payload: string } {
    const reference = createReference(status);

    const base: Record<string, unknown> = {
        reference,
        status,
        url: locationHref,
        capturedAt: context.timestamp,
    };

    if (debugEnabled) {
        base.message = context.error.message;
        base.name = context.error.name;
        base.stack = context.error.stack;
        base.componentStack = context.componentStack;
        base.component = initialPage.component;
        base.props = initialPage.props;
        base.version = initialPage.version;
    }

    return {
        reference,
        payload: JSON.stringify(base, null, 2),
    };
}

function UnexpectedTemplate({
    status,
    titleLine,
    summaryTitle,
    summaryMessage,
    reference,
    timestampLabel,
    copyPayload,
    primaryHref,
    primaryLabel,
    secondaryHref,
    secondaryLabel,
    supportHref,
    quickLinks,
    onTryAgain,
    includeHead = true,
    detailHeading,
    detailHint,
    copyLabel,
    copySuccessLabel = 'Copied',
}: TemplateProps) {
    const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
    const [detailsOpen, setDetailsOpen] = useState(true);

    useEffect(() => {
        if (!includeHead && typeof document !== 'undefined') {
            document.title = `${status} · Unexpected error`;
        }

    }, [includeHead, status]);

    const handleCopy = async () => {
        if (typeof navigator === 'undefined' || !navigator.clipboard) {
            setCopyState('error');

            return;
        }

        try {
            await navigator.clipboard.writeText(copyPayload);
            setCopyState('copied');
            setTimeout(() => setCopyState('idle'), 2800);
        } catch (error) {
            console.error('Failed to copy error details', error);
            setCopyState('error');
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
            {includeHead ? <Head title={`${status} · Unexpected error`} /> : null}

            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.22),_transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(99,102,241,0.25),_transparent_60%)]" />
                <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-rose-500/25 via-transparent to-transparent blur-3xl" />
                <div className="absolute -left-56 top-1/4 size-[520px] rounded-full bg-violet-500/20 blur-3xl" />
                <div className="absolute -right-48 bottom-10 size-[460px] rounded-full bg-amber-500/15 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-12 sm:px-8 lg:px-12">
                <header className="flex flex-col gap-3 text-xs uppercase tracking-[0.35em] text-white/55">
                    <span>Signal disrupted</span>
                    <span>{status} · Unexpected error</span>
                </header>

                <main className="mt-12 flex flex-1 flex-col gap-12">
                    <div className="flex flex-col gap-8 rounded-4xl border border-white/10 bg-white/5 p-8 shadow-[0_55px_130px_-60px_rgba(249,115,22,0.55)] backdrop-blur lg:flex-row lg:items-center lg:gap-12 lg:p-10">
                        <div className="space-y-6 lg:flex-1">
                            <div className="flex items-center gap-3 text-white/75">
                                <span className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/10">
                                    <AlertTriangle className="size-5 text-amber-300" />
                                </span>
                                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/55">
                                    {summaryTitle}
                                </p>
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-[2.5rem]">
                                {titleLine}
                            </h1>
                            <p className="text-sm leading-relaxed text-white/70">
                                We hit a snag while loading this experience. You can retry the
                page, copy the technical details for support, or jump to a safe
                location while we stabilize things.
                            </p>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                                <Button
                                    asChild
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_55px_-28px_rgba(249,115,22,0.6)] transition hover:scale-[1.01]"
                                >
                                    <Link href={primaryHref}>{primaryLabel}</Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="ghost"
                                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm text-white transition hover:border-white/35 hover:bg-white/15"
                                >
                                    <Link href={secondaryHref}>{secondaryLabel}</Link>
                                </Button>
                                {onTryAgain ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="inline-flex items-center justify-center gap-2 rounded-full border-white/25 bg-white/10 px-6 py-3 text-sm text-white transition hover:border-white/45 hover:bg-white/15"
                                        onClick={onTryAgain}
                                    >
                                        <RefreshCw className="size-4" />
                                        Try again
                                    </Button>
                                ) : null}
                            </div>
                        </div>

                        <div className="relative flex flex-1 flex-col gap-4 rounded-3xl border border-white/15 bg-black/30 p-6 shadow-[0_45px_120px_-60px_rgba(99,102,241,0.45)]">
                            <p className="text-[0.65rem] uppercase tracking-[0.4em] text-white/45">
                                Error summary
                            </p>
                            <p className="text-sm font-semibold text-white">
                                {summaryMessage}
                            </p>
                            <p className="text-xs text-white/55">{timestampLabel}</p>
                            <p className="text-xs text-white/55">
                                Reference:{' '}
                                <span className="font-mono text-white">{reference}</span>
                            </p>
                            <Button
                                type="button"
                                variant="ghost"
                                className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-white/30 hover:bg-white/15"
                                onClick={handleCopy}
                            >
                                {copyState === 'copied' ? (
                                    <>
                                        <Check className="size-4 text-emerald-300" />
                                        {copySuccessLabel}
                                    </>
                                ) : (
                                    <>
                                        <Clipboard className="size-4" />
                                        {copyLabel}
                                    </>
                                )}
                            </Button>
                            {detailHint && (
                                <p className="text-xs leading-relaxed text-white/60">
                                    {detailHint}
                                </p>
                            )}
                            {copyState === 'error' && (
                                <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                                    Clipboard unavailable. You can still select the details below
                                    and copy them manually.
                                </p>
                            )}
                        </div>
                    </div>

                    <section className="space-y-4">
                        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                            <CollapsibleTrigger asChild>
                                <button className="flex w-full items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-left text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10">
                                    <span>{detailHeading}</span>
                                    <span className="text-xs uppercase tracking-[0.3em] text-white/55">
                                        {detailsOpen ? 'Collapse' : 'Expand'}
                                    </span>
                                </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-3 overflow-hidden rounded-3xl border border-white/10 bg-black/40">
                                <pre className="max-h-[320px] overflow-auto px-5 py-5 text-xs leading-relaxed text-white/70">
                                    {copyPayload}
                                </pre>
                            </CollapsibleContent>
                        </Collapsible>
                    </section>

                    <section className="space-y-5">
                        <p className="text-[0.7rem] uppercase tracking-[0.35em] text-white/50">
                            Quick links
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {quickLinks.map(({ title, description, href }) => (
                                <Link
                                    key={title}
                                    href={href}
                                    className="group relative flex h-full flex-col justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-5 text-left text-white transition hover:border-white/30 hover:bg-white/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="rounded-2xl border border-white/10 bg-white/10 p-2.5 text-white">
                                            <Sparkles className="size-5" />
                                        </span>
                                        <p className="text-sm font-semibold">{title}</p>
                                    </div>
                                    <p className="text-xs leading-relaxed text-white/65">
                                        {description}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </section>
                </main>

                <footer className="mt-16 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/45">
                    <Button
                        type="button"
                        variant="ghost"
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white transition hover:border-white/30 hover:bg-white/10"
                        onClick={() => {
                            if (typeof window !== 'undefined') {
                                window.history.back();
                            }
                        }}
                    >
                        <ArrowLeft className="size-4" />
                        Go back
                    </Button>
                    <Button
                        asChild
                        variant="ghost"
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white transition hover:border-white/30 hover:bg-white/10"
                    >
                        <a href={supportHref}>
                            <Mail className="size-4" />
                            Contact support
                        </a>
                    </Button>
                </footer>
            </div>
        </div>
    );
}

type UnexpectedPageProps = {
    status?: number;
    exceptionMessage?: string | null;
    exceptionClass?: string | null;
    reportId?: string | null;
    debug?: boolean;
};

export default function Unexpected({
    status = 500,
    exceptionMessage,
    exceptionClass,
    reportId,
    debug,
}: UnexpectedPageProps) {
    const page = usePage<SharedData>();
    const shared = page.props as Partial<SharedData>;
    const isAuthenticated = Boolean(shared?.auth?.user);
    const locationHref =
        typeof window === 'undefined' ? page.url : window.location.href;
    const debugEnabled = Boolean(debug ?? import.meta.env.DEV);
    const capturedAt = useMemo(() => new Date().toISOString(), []);

    const { reference, payload } = useMemo(
        () =>
            buildServerPayload({
                status,
                exceptionMessage,
                exceptionClass,
                reportId,
                locationHref,
                component: page.component,
                props: page.props,
                version: page.version,
                userSummary: debugEnabled ? getUserSummary(shared) : undefined,
                debugEnabled,
                capturedAt,
            }),
        [
            capturedAt,
            debugEnabled,
            exceptionClass,
            exceptionMessage,
            locationHref,
            page.component,
            page.props,
            page.version,
            reportId,
            shared,
            status,
        ],
    );

    const supportHref = buildSupportHref(payload, locationHref);
    const detailHint = debugEnabled
        ? undefined
        : 'We only include a reference code, timestamp, and page link. Share this with support if they request more details.';
    const copyLabel = debugEnabled ? 'Copy details' : 'Copy reference';
    const copySuccessLabel = debugEnabled ? 'Copied' : 'Reference copied';

    const handleRetry = () => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    return (
        <UnexpectedTemplate
            status={status}
            titleLine="Something glitched mid-scene."
            summaryTitle={exceptionClass ?? 'Unexpected error'}
            summaryMessage={
                exceptionMessage ??
                'We ran into an issue completing that request. Please try again.'
            }
            reference={reference}
            timestampLabel={`Captured at ${new Date(capturedAt).toLocaleString()}`}
            copyPayload={payload}
            primaryHref={isAuthenticated ? dashboard() : '/'}
            primaryLabel={isAuthenticated ? 'Return to dashboard' : 'Go home'}
            secondaryHref={isAuthenticated ? '/signals' : login()}
            secondaryLabel={isAuthenticated ? 'Explore signals' : 'Log in'}
            supportHref={supportHref}
            quickLinks={isAuthenticated ? memberQuickLinks : guestQuickLinks}
            onTryAgain={handleRetry}
            detailHeading={debugEnabled ? 'Error details' : 'Support reference data'}
            detailHint={detailHint}
            copyLabel={copyLabel}
            copySuccessLabel={copySuccessLabel}
        />
    );
}

export type AppErrorBoundaryFallbackProps = {
    context: BoundaryContext;
    initialPage: AppProps['initialPage'];
};

export function AppErrorBoundaryFallback({
    context,
    initialPage,
}: AppErrorBoundaryFallbackProps) {
    const shared = initialPage.props as Partial<SharedData>;
    const isAuthenticated = Boolean(shared?.auth?.user);
    const status =
        (initialPage.props as Record<string, unknown>)?.status as number | undefined;
    const effectiveStatus = status ?? 500;
    const locationHref =
        typeof window === 'undefined' ? initialPage.url : window.location.href;
    const debugFlag = (initialPage.props as Record<string, unknown>)?.debug as
        | boolean
        | undefined;
    const debugEnabled = Boolean(debugFlag ?? import.meta.env.DEV);

    const { reference, payload } = useMemo(
        () =>
            buildClientPayload({
                status: effectiveStatus,
                context,
                initialPage,
                locationHref,
                debugEnabled,
            }),
        [
            context,
            debugEnabled,
            effectiveStatus,
            initialPage,
            locationHref,
        ],
    );

    const supportHref = buildSupportHref(payload, locationHref);
    const detailHint = debugEnabled
        ? undefined
        : 'We only include a reference code, timestamp, and page link. Share this with support if they request more details.';
    const copyLabel = debugEnabled ? 'Copy details' : 'Copy reference';
    const copySuccessLabel = debugEnabled ? 'Copied' : 'Reference copied';

    const summaryMessage = debugEnabled
        ? context.error.message || 'An unexpected issue occurred.'
        : 'We ran into a glitch while loading this experience. Please try again shortly.';

    const handleReset = () => {
        context.reset();

        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    return (
        <UnexpectedTemplate
            status={effectiveStatus}
            titleLine="Something glitched mid-scene."
            summaryTitle={context.error.name || 'Unexpected error'}
            summaryMessage={summaryMessage}
            reference={reference}
            timestampLabel={`Captured at ${new Date(context.timestamp).toLocaleString()}`}
            copyPayload={payload}
            primaryHref={isAuthenticated ? dashboard() : '/'}
            primaryLabel={isAuthenticated ? 'Return to dashboard' : 'Go home'}
            secondaryHref={isAuthenticated ? '/signals' : login()}
            secondaryLabel={isAuthenticated ? 'Explore signals' : 'Log in'}
            supportHref={supportHref}
            quickLinks={isAuthenticated ? memberQuickLinks : guestQuickLinks}
            onTryAgain={handleReset}
            includeHead={false}
            detailHeading={debugEnabled ? 'Error details' : 'Support reference data'}
            detailHint={detailHint}
            copyLabel={copyLabel}
            copySuccessLabel={copySuccessLabel}
        />
    );
}


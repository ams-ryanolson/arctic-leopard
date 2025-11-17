import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Cookie, SlidersHorizontal, ShieldCheck, Check, X } from 'lucide-react';

type CookiesBannerProps = {
    open?: boolean;
    onClose?: () => void;
    isPreview?: boolean;
    className?: string;
    leaveUrl?: string;
};

export default function CookiesBanner({
    open,
    onClose,
    isPreview = false,
    className,
}: CookiesBannerProps) {
    const { props } = usePage();
    const config = (props as any)?.cookies ?? {};
    const banner = config.banner ?? {};
    const defaults = config.defaults ?? {};
    const services = (config.services ?? []) as Array<{ name: string; url: string }>;
    const doNotSellDefault = Boolean((config as any)?.do_not_sell_default ?? false);
    const repromptDays = Number((config as any)?.reprompt_days ?? 180);

    const [visible, setVisible] = useState<boolean>(Boolean(open));
    const [expanded, setExpanded] = useState<boolean>(false);
    const [analytics, setAnalytics] = useState<boolean>(Boolean(defaults.analytics));
    const [marketing, setMarketing] = useState<boolean>(Boolean(defaults.marketing));
    const [doNotSell, setDoNotSell] = useState<boolean>(doNotSellDefault);
    const barRef = useRef<HTMLDivElement | null>(null);

    const readCookie = (name: string): string | null => {
        if (typeof document === 'undefined') return null;
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
    };
    const setCookie = (name: string, value: string, days: number) => {
        if (typeof document === 'undefined') return;
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        const expires = '; expires=' + date.toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; Secure; SameSite=Lax`;
    };

    useEffect(() => {
        if (open !== undefined) {
            setVisible(open);
            return;
        }
        if (isPreview) return setVisible(true);
        const isAuthed = Boolean((props as any)?.auth?.user);
        if (isAuthed) {
            // still show to authed if preview only; otherwise hide
            setVisible(false);
            return;
        }
        const consent = readCookie('rk_cookie_consent');
        if (!(banner.enabled === false) && !consent) {
            // no consent stored → initialize from defaults and show
            setAnalytics(Boolean(defaults.analytics));
            setMarketing(Boolean(defaults.marketing));
            setDoNotSell(doNotSellDefault);
            setVisible(true);
            return;
        }
        setVisible(false);
    }, [open, isPreview, props, banner.enabled]);

    const saveConsent = (consent: { necessary: boolean; analytics: boolean; marketing: boolean }) => {
        if (isPreview) return;
        setCookie('rk_cookie_consent', JSON.stringify({ ...consent, ts: Date.now() }), repromptDays || 180);
    };

    const acceptAll = () => {
        saveConsent({ necessary: true, analytics: true, marketing: true });
        setVisible(false);
        onClose?.();
    };
    const rejectNonEssential = () => {
        saveConsent({ necessary: true, analytics: false, marketing: false });
        setVisible(false);
        onClose?.();
    };
    const saveChoices = () => {
        saveConsent({ necessary: true, analytics, marketing });
        setVisible(false);
        onClose?.();
    };

    if (!visible) return null;

    return (
        <div
            className={cn(
                'fixed inset-0 z-[90] flex items-end justify-center',
                'bg-neutral-950/40 backdrop-blur-sm',
                className,
            )}
            aria-live="polite"
        >
            <div
                ref={barRef}
                className={cn(
                    'mx-4 mb-6 w-full max-w-4xl overflow-hidden rounded-2xl border border-white/12',
                    'bg-gradient-to-b from-neutral-950/95 via-neutral-950/90 to-black/85',
                    'shadow-[0_35px_100px_-35px_rgba(249,115,22,0.45)] ring-1 ring-white/10',
                    'animate-in slide-in-from-bottom duration-200',
                )}
                role="region"
                aria-label="Cookie consent"
            >
                <div className="flex items-start gap-3 border-b border-white/10 px-5 py-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 ring-1 ring-amber-400/30">
                        <Cookie className="size-5 text-amber-300" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">Cookies & Privacy</p>
                        <p className="text-xs leading-5 text-white/60">
                        We use cookies to deliver and improve our services, analyze site usage, and if you agree, to customize or personalize your experience and market our services to you. You can read our Cookie Policy here.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="ml-auto rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/70 transition hover:bg-white/10"
                        onClick={() => setExpanded((e) => !e)}
                        aria-expanded={expanded}
                        aria-controls="cookie-details"
                        title="Customize"
                    >
                        <SlidersHorizontal className="size-4" />
                    </button>
                </div>
                <div className="px-5 pb-5 pt-4">
                    <p className="text-sm leading-6 text-white/90">
                        {(banner.message ??
                            'We use cookies to deliver and improve our services, analyze site usage, and if you agree, to customize or personalize your experience and market our services to you.')}
                        {' '}
                        {banner.policy_url && (
                            <>
                                You can read our{' '}
                                <a href={banner.policy_url} className="text-amber-300 underline underline-offset-2 hover:text-amber-200">
                                    Cookie Policy
                                </a>
                                .
                            </>
                        )}
                    </p>
                    {expanded && (
                        <div id="cookie-details" className="mt-4">
                            <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[13px] text-white/80">
                            Our website uses cookies to distinguish you from other users of our website. This helps us provide you with a more personalized experience when you browse our website and also allows us to improve our site. Cookies may collect information that is used to tailor ads shown to you on our website and other websites. The information might be about you, your preferences or your device. The information does not usually directly identify you, but it can give you a more personalized web experience. You can choose not to allow some types of cookies.
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                            <div
                                className="text-left rounded-xl border p-3 transition border-amber-400/40 bg-amber-400/10 shadow-[0_0_0_1px_rgba(251,191,36,0.25)_inset]"
                                aria-disabled="true"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-white">Necessary</p>
                                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                                        <ShieldCheck className="size-3" /> Enabled
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-white/65">
                                    Required for sign‑in, security, and core site features.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAnalytics((v) => !v)}
                                role="switch"
                                aria-checked={analytics}
                                tabIndex={0}
                                className={[
                                    'text-left rounded-xl border p-3 transition',
                                    analytics
                                        ? 'border-amber-400/40 bg-amber-400/10 shadow-[0_0_0_1px_rgba(251,191,36,0.25)_inset]'
                                        : 'border-white/10 bg-white/[0.03] hover:bg-white/10',
                                ].join(' ')}
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-white">Analytics</p>
                                    {analytics && (
                                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                                            <Check className="size-3" /> Enabled
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-white/65">Helps us understand usage to improve the product.</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMarketing((v) => !v)}
                                role="switch"
                                aria-checked={marketing}
                                tabIndex={0}
                                className={[
                                    'text-left rounded-xl border p-3 transition',
                                    marketing
                                        ? 'border-amber-400/40 bg-amber-400/10 shadow-[0_0_0_1px_rgba(251,191,36,0.25)_inset]'
                                        : 'border-white/10 bg-white/[0.03] hover:bg-white/10',
                                ].join(' ')}
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-white">Marketing</p>
                                    {marketing && (
                                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                                            <Check className="size-3" /> Enabled
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-white/65">Used for personalization and partner tools.</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setDoNotSell((v) => !v)}
                                role="switch"
                                aria-checked={doNotSell}
                                tabIndex={0}
                                className={[
                                    'md:col-span-3 text-left rounded-xl border p-3 transition',
                                    doNotSell
                                        ? 'border-amber-400/40 bg-amber-400/10 shadow-[0_0_0_1px_rgba(251,191,36,0.25)_inset]'
                                        : 'border-white/10 bg-white/[0.03] hover:bg-white/10',
                                ].join(' ')}
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-white">
                                        Do not sell or share my personal information
                                    </p>
                                    {doNotSell && (
                                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                                            <Check className="size-3" /> Enabled
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-xs text-white/65">
                                    We do not sell personal information. Limited, anonymous data may be shared to measure performance
                                    and improve services. Enable this to opt out of any sharing used for targeted advertising.
                                </p>
                            </button>
                            {services && services.length > 0 && (
                                <div className="md:col-span-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                                    <p className="text-xs font-semibold text-white">Third-Party Services</p>
                                    <ul className="mt-2 grid gap-2 text-xs text-white/70 md:grid-cols-2">
                                        {services.map((svc, idx) => (
                                            <li key={idx} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
                                                <span className="truncate">{svc.name}</span>
                                                {svc.url && (
                                                    <a
                                                        href={svc.url}
                                                        className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/70 hover:bg-white/10"
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        Policy
                                                    </a>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            </div>
                        </div>
                    )}

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                className="border-white/15 text-white/85 hover:bg-white/10"
                                onClick={rejectNonEssential}
                            >
                                Reject non‑essential
                            </Button>
                            <Button
                                variant="outline"
                                className="border-white/15 text-white/85 hover:bg-white/10"
                                onClick={() => setExpanded(true)}
                            >
                                Customize
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            {expanded && (
                                <Button
                                    variant="outline"
                                    className="border-white/15 text-white/85 hover:bg-white/10"
                                    onClick={saveChoices}
                                >
                                    Save choices
                                </Button>
                            )}
                            <Button
                                className="bg-gradient-to-r from-amber-500/90 via-rose-500/80 to-indigo-500/80 text-white shadow-[0_12px_30px_-18px_rgba(249,115,22,0.45)]"
                                onClick={acceptAll}
                            >
                                {banner.cta_label || 'Accept all'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}



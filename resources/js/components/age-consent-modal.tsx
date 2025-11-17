import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { AlertTriangle, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type AgeConsentModalProps = {
    open?: boolean;
    onClose?: () => void;
    isPreview?: boolean;
    className?: string;
    text?: string;
    leaveUrl?: string;
};

export default function AgeConsentModal({
    open,
    onClose,
    isPreview = false,
    className,
    text,
    leaveUrl,
}: AgeConsentModalProps) {
    const { props } = usePage();
    const site = (props as any)?.site;
    const defaultText =
        typeof text === 'string' && text.length > 0
            ? text
            : ((props as any)?.legal?.age_of_consent_text ??
              'You must be 18 or older to use this site.');

    const [visible, setVisible] = useState<boolean>(Boolean(open));
    const dialogRef = useRef<HTMLDivElement | null>(null);

    const readCookie = (name: string): string | null => {
        if (typeof document === 'undefined') return null;
        const match = document.cookie.match(
            new RegExp('(^| )' + name + '=([^;]+)'),
        );
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
        if (isPreview) {
            setVisible(true);
            return;
        }
        const isAuthed = Boolean((props as any)?.auth?.user);
        if (isAuthed) {
            setVisible(false);
            return;
        }
        const accepted = readCookie('rk_age_consent') === '1';
        setVisible(!accepted);
    }, [open, isPreview, props]);

    useEffect(() => {
        if (!visible) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isPreview) {
                e.preventDefault();
                onClose?.();
                setVisible(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [visible, isPreview, onClose]);

    useEffect(() => {
        if (!visible) return;
        // basic focus management
        const firstButton = dialogRef.current?.querySelector('button');
        (firstButton as HTMLButtonElement | undefined)?.focus?.();
    }, [visible]);

    const accept = () => {
        if (!isPreview) {
            setCookie('rk_age_consent', '1', 30);
        }
        setVisible(false);
        onClose?.();
    };

    const leave = () => {
        const target = leaveUrl || 'https://google.com';
        window.location.assign(target);
    };

    if (!visible) {
        return null;
    }

    const siteLogo =
        (site?.logo?.url as string) || (site?.logo?.dark_url as string) || '';
    const siteName = (site?.name as string) || 'This site';

    return (
        <div
            className={cn(
                'fixed inset-0 z-[100] flex items-center justify-center',
                'bg-neutral-950/75 backdrop-blur-md',
                className,
            )}
            role="dialog"
            aria-modal="true"
        >
            <div
                ref={dialogRef}
                className={cn(
                    'relative mx-4 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10',
                    'bg-gradient-to-b from-neutral-950/95 via-neutral-950/90 to-black/85',
                    'shadow-[0_40px_120px_-40px_rgba(249,115,22,0.45)] ring-1 ring-white/10',
                    'animate-in duration-200 zoom-in-95 fade-in',
                )}
            >
                <div className="pointer-events-none absolute -inset-1 -z-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.16),_transparent_65%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(96,165,250,0.16),_transparent_60%)]" />
                    <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-500/20 blur-3xl" />
                </div>

                <div className="flex items-center gap-4 border-b border-white/10 px-6 py-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 ring-1 ring-amber-400/30">
                        <ShieldCheck className="size-7 text-amber-300" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold text-white">
                            Age of Consent
                        </h2>
                        <p className="truncate text-[13px] text-white/60">
                            {siteName}
                        </p>
                    </div>
                    {siteLogo ? (
                        <div className="ml-auto">
                            <img
                                src={siteLogo}
                                alt={`${siteName} logo`}
                                className="h-7 w-auto opacity-90"
                            />
                        </div>
                    ) : null}
                </div>

                <div className="px-6 pt-5 pb-6">
                    <p className="text-[15px] leading-7 text-white/90">
                        {defaultText}
                    </p>
                    <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="flex items-start gap-2 text-[13px] text-white/80">
                            <AlertTriangle className="mt-0.5 size-4 text-amber-300" />
                            <span>
                                By continuing, you confirm you are of legal age
                                in your jurisdiction.
                            </span>
                        </div>
                        <div className="flex items-start gap-2 text-[13px] text-white/80">
                            <Check className="mt-0.5 size-4 text-emerald-300" />
                            <span>
                                You agree to our{' '}
                                <a
                                    href="/terms"
                                    className="text-amber-300 underline underline-offset-2 hover:text-amber-200"
                                >
                                    Terms
                                </a>
                                ,{' '}
                                <a
                                    href="/privacy"
                                    className="text-amber-300 underline underline-offset-2 hover:text-amber-200"
                                >
                                    Privacy Policy
                                </a>{' '}
                                and{' '}
                                <a
                                    href="/guidelines"
                                    className="text-amber-300 underline underline-offset-2 hover:text-amber-200"
                                >
                                    Community Guidelines
                                </a>
                                .
                            </span>
                        </div>
                    </div>
                    <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <p className="text-[12px] leading-6 text-white/60">
                            Why this matters: protecting minors from adult
                            content is a shared responsibility. Age prompts help
                            ensure legal compliance and a safer community
                            experience. Learn more from{' '}
                            <a
                                href="/guidelines"
                                className="text-amber-300 underline underline-offset-2 hover:text-amber-200"
                            >
                                our guidelines
                            </a>
                            .
                        </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                        {!isPreview ? (
                            <Button
                                variant="outline"
                                className="inline-flex items-center gap-2 border-white/15 bg-white/5 px-3 py-2 text-xs text-white/85 transition hover:bg-white/10"
                                onClick={leave}
                            >
                                <ExternalLink className="size-3.5" />
                                Take me out
                            </Button>
                        ) : (
                            <span />
                        )}
                        <div className="flex items-center gap-2">
                            <Button
                                className="bg-gradient-to-r from-amber-500/90 via-rose-500/80 to-indigo-500/80 text-white shadow-[0_12px_30px_-18px_rgba(249,115,22,0.45)]"
                                onClick={accept}
                            >
                                {isPreview ? 'Looks good' : 'Let me in!'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

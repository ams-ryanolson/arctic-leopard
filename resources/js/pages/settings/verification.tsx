import VerificationFlow from '@/components/verification/VerificationFlow';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'ID Verification',
        href: '/settings/account/verification',
    },
];

type VerificationStatus = {
    status: string | null;
    provider?: string;
    verified_at?: string | null;
    expires_at?: string | null;
    renewal_required_at?: string | null;
    is_expired?: boolean;
    is_in_grace_period?: boolean;
    needs_renewal?: boolean;
} | null;

export default function Verification({
    verificationStatus,
}: {
    verificationStatus: VerificationStatus;
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="ID Verification" />

            <SettingsLayout>
                <div className="space-y-8">
                    {/* Enhanced Header with Sumsub Security Info */}
                    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-violet-500/10 p-8 text-white shadow-[0_32px_85px_-40px_rgba(124,58,237,0.45)] transition-all duration-300 hover:border-violet-400/30 hover:shadow-[0_40px_100px_-40px_rgba(124,58,237,0.55)]">
                        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.15),_transparent_60%)]" />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="relative space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="flex items-center justify-center rounded-2xl border border-violet-400/40 bg-gradient-to-br from-violet-400/30 to-violet-500/20 p-3 shadow-[0_12px_30px_-18px_rgba(124,58,237,0.65)]">
                                    <ShieldCheck className="h-6 w-6 text-violet-300" />
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <h1 className="mb-1 text-2xl font-bold text-white">
                                            Identity Verification
                                        </h1>
                                        <p className="text-sm text-white/70">
                                            Secured by Sumsub - Industry-leading
                                            identity verification
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 backdrop-blur-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex size-6 flex-shrink-0 items-center justify-center rounded-lg border border-emerald-400/40 bg-emerald-400/20">
                                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <p className="text-sm font-semibold text-emerald-200">
                                                    Bank-Level Security
                                                </p>
                                                <p className="text-xs leading-relaxed text-emerald-200/90">
                                                    Sumsub is trusted by major
                                                    financial institutions,
                                                    crypto exchanges, and
                                                    platforms worldwide. Your
                                                    data is encrypted with
                                                    end-to-end security, GDPR &
                                                    SOC 2 compliant, and never
                                                    stored on our servers. We
                                                    only see that your
                                                    verification was
                                                    successful—your personal
                                                    documents remain completely
                                                    private.
                                                </p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-emerald-200/70">
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="size-1 rounded-full bg-emerald-400" />
                                                        SOC 2 Certified
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="size-1 rounded-full bg-emerald-400" />
                                                        GDPR Compliant
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="size-1 rounded-full bg-emerald-400" />
                                                        End-to-End Encrypted
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <VerificationFlow
                        mode="settings"
                        verificationStatus={verificationStatus}
                        onComplete={() => {
                            // Reload will happen automatically via router.reload in component
                        }}
                    />
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

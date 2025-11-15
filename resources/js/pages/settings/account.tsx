import AccountController from '@/actions/App/Http/Controllers/Settings/AccountController';
import DataExportController from '@/actions/App/Http/Controllers/Settings/DataExportController';
import DeleteUser from '@/components/delete-user';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Form, Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Download, ShieldCheck, AlertTriangle, Database, FileDown, Shield, Clock, CheckCircle2, Loader2, XCircle, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Account settings',
        href: '/settings/account',
    },
];

type Export = {
    id: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    file_size: number | null;
    created_at: string | null;
    expires_at: string | null;
    downloaded_at: string | null;
    is_expired: boolean;
    is_downloaded: boolean;
    is_pending: boolean;
    is_processing: boolean;
    is_completed: boolean;
    is_failed: boolean;
};

export default function Account({
    verificationStatus = null,
    exports = [],
}: {
    verificationStatus?: string | null;
    exports?: Export[];
}) {
    const formatFileSize = (bytes: number | null): string => {
        if (!bytes) {
            return 'Unknown size';
        }
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    const formatDate = (dateString: string | null): string => {
        if (!dateString) {
            return 'Unknown';
        }
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleDownload = (exportId: number) => {
        // Use window.location to bypass Inertia and trigger a direct download
        window.location.href = DataExportController.download.url(exportId);
    };

    const handleDelete = (exportId: number) => {
        if (confirm('Are you sure you want to delete this export? This action cannot be undone.')) {
            router.delete(DataExportController.destroy.url(exportId), {
                preserveScroll: true,
            });
        }
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Account settings" />

            <SettingsLayout>
                <div className="space-y-8">
                    {/* Data Export Section */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(16,185,129,0.45)]">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-emerald-500/15 via-emerald-400/5 to-transparent blur-2xl" />
                        </div>
                        <div className="relative space-y-6 p-6 sm:p-8">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/30 to-emerald-500/20 border border-emerald-400/40 p-3 shadow-[0_12px_30px_-18px_rgba(16,185,129,0.65)]">
                                    <FileDown className="h-5 w-5 text-emerald-300" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Data export</h2>
                                    <p className="text-sm text-white/65">
                                        Download a copy of your account data
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                                <p className="mb-4 text-sm leading-relaxed text-white/70">
                                    You can request a download of all your account data, including your profile information,
                                    posts, messages, and media files. The export will be generated as a ZIP file and you
                                    will be notified when it's ready for download.
                                </p>
                                <Form
                                    {...DataExportController.export.form()}
                                    options={{
                                        preserveScroll: true,
                                    }}
                                >
                                    {({ processing }) => (
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(16,185,129,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_16px_-4px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            {processing ? 'Requesting export...' : 'Request data export'}
                                        </Button>
                                    )}
                                </Form>
                            </div>
                        </div>
                    </div>

                    {exports.length > 0 && (
                        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(59,130,246,0.45)]">
                            <div className="pointer-events-none absolute inset-0">
                                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-blue-500/15 via-blue-400/5 to-transparent blur-2xl" />
                            </div>
                            <div className="relative space-y-6 p-6 sm:p-8">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-400/30 to-blue-500/20 border border-blue-400/40 p-3 shadow-[0_12px_30px_-18px_rgba(59,130,246,0.65)]">
                                        <Database className="h-5 w-5 text-blue-300" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">Export history</h2>
                                        <p className="text-sm text-white/65">
                                            View and download your previous data exports
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {exports.map((exportItem) => (
                                        <div
                                            key={exportItem.id}
                                            className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20 hover:bg-black/30"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        {exportItem.is_pending && (
                                                            <Clock className="h-4 w-4 text-amber-400" />
                                                        )}
                                                        {exportItem.is_processing && (
                                                            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                                                        )}
                                                        {exportItem.is_completed && (
                                                            <FileDown className="h-4 w-4 text-emerald-400" />
                                                        )}
                                                        {exportItem.is_failed && (
                                                            <XCircle className="h-4 w-4 text-rose-400" />
                                                        )}
                                                        <span className="text-sm font-medium text-white">
                                                            Export from {formatDate(exportItem.created_at)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-white/60">
                                                        {exportItem.file_size && (
                                                            <span>{formatFileSize(exportItem.file_size)}</span>
                                                        )}
                                                        {exportItem.is_pending && (
                                                            <span className="flex items-center gap-1 text-amber-400">
                                                                Queued
                                                            </span>
                                                        )}
                                                        {exportItem.is_processing && (
                                                            <span className="flex items-center gap-1 text-blue-400">
                                                                Processing...
                                                            </span>
                                                        )}
                                                        {exportItem.is_completed && exportItem.is_expired && (
                                                            <span className="flex items-center gap-1 text-amber-400">
                                                                <Clock className="h-3 w-3" />
                                                                Expired
                                                            </span>
                                                        )}
                                                        {exportItem.is_completed && !exportItem.is_expired && exportItem.is_downloaded && (
                                                            <span className="flex items-center gap-1 text-emerald-400">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                Downloaded
                                                            </span>
                                                        )}
                                                        {exportItem.is_completed && !exportItem.is_expired && !exportItem.is_downloaded && (
                                                            <span className="flex items-center gap-1 text-blue-400">
                                                                <Clock className="h-3 w-3" />
                                                                Expires {formatDate(exportItem.expires_at)}
                                                            </span>
                                                        )}
                                                        {exportItem.is_failed && (
                                                            <span className="flex items-center gap-1 text-rose-400">
                                                                Failed
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {exportItem.is_completed && !exportItem.is_expired && (
                                                        <Button
                                                            onClick={() => handleDownload(exportItem.id)}
                                                            className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_4px_12px_-4px_rgba(16,185,129,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_16px_-4px_rgba(16,185,129,0.5)]"
                                                        >
                                                            <Download className="mr-2 h-3.5 w-3.5" />
                                                            Download
                                                        </Button>
                                                    )}
                                                    <Button
                                                        onClick={() => handleDelete(exportItem.id)}
                                                        variant="outline"
                                                        className="rounded-full border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:border-rose-500/40 hover:bg-rose-500/20 hover:text-rose-50"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ID Verification Section */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(124,58,237,0.45)]">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-violet-500/15 via-violet-400/5 to-transparent blur-2xl" />
                        </div>
                        <div className="relative space-y-6 p-6 sm:p-8">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-400/30 to-violet-500/20 border border-violet-400/40 p-3 shadow-[0_12px_30px_-18px_rgba(124,58,237,0.65)]">
                                    <Shield className="h-5 w-5 text-violet-300" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">ID Verification</h2>
                                    <p className="text-sm text-white/65">
                                        Verify your identity using Veriff
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-4">
                            {verificationStatus === 'verified' ? (
                                <>
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <ShieldCheck className="h-5 w-5" />
                                        <p className="text-sm font-semibold text-white">
                                            Your identity has been verified
                                        </p>
                                    </div>
                                    <p className="text-sm text-white/70">
                                        Your account has been verified through Veriff. This helps ensure the safety and
                                        authenticity of our community.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                                        <p className="text-sm font-semibold text-white">
                                            Identity verification required
                                        </p>
                                    </div>
                                    <p className="text-sm text-white/70">
                                        Verify your identity to access additional features and help maintain a safe
                                        community. Verification is handled securely through Veriff.
                                    </p>
                                    <Button
                                        asChild
                                        className="rounded-full bg-gradient-to-r from-violet-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(124,58,237,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_6px_16px_-4px_rgba(124,58,237,0.5)]"
                                    >
                                        <Link href="/settings/account/verification">
                                            Start verification
                                        </Link>
                                    </Button>
                                </>
                            )}
                            </div>
                        </div>
                    </div>

                    {/* Delete Account Section */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-black/20 shadow-[0_32px_85px_-40px_rgba(236,72,153,0.45)]">
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-rose-500/15 via-rose-400/5 to-transparent blur-2xl" />
                        </div>
                        <div className="relative space-y-6 p-6 sm:p-8">
                            <DeleteUser />
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

